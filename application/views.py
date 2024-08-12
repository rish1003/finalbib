from multiprocessing.pool import AsyncResult
from operator import and_
import os
import random
from flask import jsonify, render_template, render_template_string, request
from flask_security import auth_required, current_user, roles_required,SQLAlchemyUserDatastore,auth_token_required
from flask_security.utils import verify_password,hash_password
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import pytz
from application.models import Ebook, EbookIssued, EbookSection, Review, Role, Section, User, UserRoles
from flask import Flask, send_from_directory, abort
from werkzeug.utils import secure_filename
from flask_caching import Cache
from application.tasks import export_ebooks_to_csv, send_monthly_report, remind_return_due
def create_view(app,user_datastore:SQLAlchemyUserDatastore,db : SQLAlchemy,cache):
   
    @app.route('/celerydemo')
    def celery_demo():
        task = remind_return_due.delay()
        return jsonify({'task_id':task.id})
    
    @app.route('/export_csv', methods=['POST'])
    
    def export_csv():
        task = export_ebooks_to_csv.apply_async()
        return jsonify({'task_id': task.id, 'status': 'Task started'}), 202
    
        
    @app.route('/export_status/<task_id>')
    def export_status(task_id):
        task = export_ebooks_to_csv.AsyncResult(task_id)
        if task.state == 'PENDING':
            response = {
                'state': task.state,
                'status': 'Processing...'
            }
        elif task.state != 'FAILURE':
            response = {
                'state': task.state,
                'status': task.info.get('status', ''),
                'download_url': task.info.get('download_url', '')  
            }
        else:
            response = {
                'state': task.state,
                'status': str(task.info),  
            }
        return jsonify(response)
           
    @app.route("/")
    def home():
        return render_template("index.html")
    
    @app.route('/clear_cache', methods=['POST'])
    def clear_cache():
        cache.clear()
        print("cleared")
        return jsonify({'status': 'Cache cleared'}), 200
    
    @app.route('/fetch/books', methods=['GET'])
    @roles_required('Reader')
    @cache.cached(timeout=60*5, key_prefix='all_books')
    def get_books():
        sections = Section.query.all()
        data = {}
        for section in sections:
            books = Ebook.query.join(EbookSection).filter(EbookSection.section_id == section.id).all()
            data[section.name] = [
                {
                    'id':book.id,
                    'name': book.name,
                    'imageUrl': book.url,
                    'author': book.author,
                    'section': section.name,
                    'summary' : book.summary
                }
                for book in books
            ]
        return jsonify(data)

    @app.route('/userlogin', methods=['POST'])
    def user_login():

        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        
        if not email or not password:
            return jsonify({'message' : 'not valid email or password'}), 404
        
        user = user_datastore.find_user(email = email)

        if not user:
            return jsonify({'message' : 'invalid user'}), 404
        
        if verify_password(password, user.password):
            user1 = User.query.filter_by(email=email).first()
            user1.last_login = datetime.now(pytz.timezone('Asia/Kolkata'))
            print(user1,user1.last_login)
            db.session.commit()
            roles = [role.name for role in user.roles]
            print(roles)
            return jsonify({'token' : user.get_auth_token(), 'roles' : roles, 'id' : user.id, 'email' : user.email }), 200
            
        else:
            
            return jsonify({'message' : 'Incorrect Credentials'}), 400
        
    
    @app.route('/userregis', methods=['POST'])
    def user_registration():
        data = request.get_json()
        user = data.get('username')
        email = data.get('email')
        password = data.get('password')
        hashed_password =hash_password(password)
        if not user_datastore.find_user(email=email):
            user_datastore.create_user(
                email=email, password=hashed_password, roles=["Reader"], user=user)
            db.session.commit()
            user1 = user_datastore.find_user(email = email)
            cache.delete("users_list")

            return jsonify({'token' : user1.get_auth_token(), 'roles' : "Reader", 'id' : user1.id, 'email' : user1.email }), 200
        else:
            return jsonify({"message": "Email already registered"}), 400
       
    @app.route('/api/check_token_and_login', methods=['GET'])
    @auth_required('token')  
    def check_token_and_login():
        if current_user.is_authenticated:
            roles = [role.name for role in current_user.roles]
            return jsonify({'is_logged_in': True, 'roles': roles, 'id': current_user.id, 'email': current_user.email}), 200
        else:
            return jsonify({'is_logged_in': False}), 401
    @app.route('/fetch/ebook/<string:ebook_id>', methods=['GET'])
  
    def get_ebook_details(ebook_id):
        user_id = request.args.get('user_id')  
        ebook = Ebook.query.filter_by(id=ebook_id).first()
        if not ebook:
            return jsonify({'error': 'eBook not found'}), 404

        issued = EbookIssued.query.filter_by(issued_ebook=ebook_id, issued_to=user_id).first()
        return_days = None
        if issued:
            
            return_date = issued.return_date
            if return_date.tzinfo is None:
                return_date = return_date.replace(tzinfo=pytz.timezone('Asia/Kolkata'))
           
            current_time = datetime.now(pytz.timezone('Asia/Kolkata'))
            return_days = (return_date - current_time).days + 1
            if return_days < 0:
                issued.returned = True
                issued.status = False
                db.session.commit()
                issued = None
        ebook_details = {
            'id': ebook.id,
            'name': ebook.name,
            'author': ebook.author,
            'num_pages': ebook.num_pages,
            'summary': ebook.summary,
            'url': ebook.url,
            'bookurl' : ebook.bookurl if ebook.bookurl else "default_book.pdf",
            'issued': True if issued else False,
            'status': issued.status if issued else False,
            'bought': issued.bought if issued else False,
            'return': issued.returned if issued else True,
            'return_date': issued.return_date if issued else None,
            'date_issued': issued.date_issued if issued else None,
            'days_left' : return_days
        }
        return jsonify(ebook_details)
    
    @app.route('/complete_payment', methods=['POST'])
    def complete_payment():
        try:
            data = request.json
            ebook_id = data.get('ebook_id')
            user_id = data.get('user_id')

            
            if not ebook_id or not user_id:
                return jsonify({'success': False, 'message': 'Invalid input'}), 400

            ebook = Ebook.query.get(ebook_id)
            if not ebook:
                return jsonify({'success': False, 'message': 'Ebook not found'}), 404

            ebook = EbookIssued(issued_to = user_id, issued_ebook = ebook_id, returned=False,bought=True,status=False)
            db.session.add(ebook)
            db.session.commit()


            return jsonify({'success': True, 'message': 'Payment completed successfully'})

        except Exception as e:
            print(f"Error completing payment: {e}")
            return jsonify({'success': False, 'message': 'An error occurred'}), 500
    
    @app.route('/return_book', methods=['POST'])
    @roles_required('Reader')
    def return_book():
        data = request.json
        ebook_id = data.get('ebook_id')
        user_id = data.get('user_id')
        print(ebook_id,user_id)
        
        if not ebook_id or not user_id:
            return jsonify({'success': False, 'message': 'Missing ebook_id or user_id'}), 400

        issued = EbookIssued.query.filter_by(issued_ebook=ebook_id, issued_to=user_id,status = True).first()
        if not issued:
            return jsonify({'success': False, 'message': 'Issued book not found'}), 404

        issued.status = False
        issued.returned = True
        db.session.commit()

        return jsonify({'success': True, 'message': 'Book returned successfully'})

    @app.route('/request_borrow', methods=['POST'])
    @roles_required('Reader')
    def request_borrow():
        data = request.json
        ebook_id = data.get('ebook_id')
        user_id = data.get('user_id')

        total_borrowed_or_requested = EbookIssued.query.filter_by(issued_to=user_id,returned=False,bought=False).count()
        if total_borrowed_or_requested >= 5:
            return jsonify({'error': 'You cannot borrow more than 5 eBooks at a time.'}), 400

        existing_issue = EbookIssued.query.filter_by(issued_ebook=ebook_id, issued_to=user_id, status = True).first()
        if existing_issue:
            return jsonify({'error': 'You have already requested to borrow this eBook or it is already issued to you.'}), 400

        new_issue = EbookIssued(
            issued_ebook=ebook_id,
            issued_to=user_id,
        )
        cache.delete("ebooks_history")
        db.session.add(new_issue)
        db.session.commit()

        return jsonify({'success': 'Request to borrow the eBook has been sent.'})
    
    @app.route('/issue_ebook', methods=['POST'])
    
    def issue_ebook():
        ebook_id = '9780744001402'
        user_id = '2'

        if not ebook_id or not user_id:
            return jsonify({'error': 'Ebook ID and User ID are required'}), 400

     
        ebook = Ebook.query.get(ebook_id)
        user = User.query.get(user_id)

        if not ebook:
            return jsonify({'error': 'Ebook not found'}), 404
        if not user:
            return jsonify({'error': 'User not found'}), 404

        try:
            ebook_issued = EbookIssued(issued_ebook=ebook_id, issued_to=user_id)
            
            db.session.add(ebook_issued)
            
            db.session.commit()

            return jsonify({'error': 'Found'}), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
        
            

    @app.route('/fetch/reviews/<ebook_id>', methods=['GET'])
    def fetch_reviews(ebook_id):
        ebook = Ebook.query.get(ebook_id)
        if not ebook:
            return jsonify({'error': 'eBook not found'}), 404
       
        reviews = Review.query.filter_by(ebook_id=ebook_id).all()
        
        if not reviews:
            return jsonify({'reviews': [], 'average_rating': 0, 'rating_breakdown': {}}), 200
        
        total_rating = sum(review.rating for review in reviews)
        average_rating = total_rating / len(reviews)
        
        rating_breakdown = {i: 0 for i in range(1, 6)}
        for review in reviews:
            rating_breakdown[review.rating] += 1
        
        reviews_list = [{
            'username': review.user.user,
            'rating': review.rating,
            'comment': review.comment,
            'created_at':review.created_at.strftime("%d/%m/%Y")
        } for review in reviews]

        return jsonify({
            'reviews': reviews_list,
            'average_rating': round(average_rating, 2),
            'rating_breakdown': rating_breakdown
        }), 200

    @app.route('/submit/review', methods=['POST'])
    @roles_required('Reader')
    def submit_review():
        data = request.get_json()
        user_id = data.get('user_id')
        ebook_id = data.get('ebook_id')
        rating = data.get('rating')
        comment = data.get('comment')

        if not user_id or not ebook_id or not rating:
            return jsonify({'error': 'Cannot Submit Review'}), 400

        existing_review = Review.query.filter_by(user_id=user_id, ebook_id=ebook_id).first()

        if existing_review:
            return jsonify({'error': 'You have already submitted a review for this eBook'}), 400
        new_review = Review(
            user_id=user_id,
            ebook_id=ebook_id,
            rating=rating,
            comment=comment
        )
        db.session.add(new_review)
        db.session.commit()

        return jsonify({'success': 'Review submitted successfully'}), 200
    
    @app.route('/fetch/borrowed_books/<int:user_id>', methods=['GET'])
    def fetch_borrowed_books(user_id):
        try:
            borrowed_books_ids = db.session.query(EbookIssued.issued_ebook).filter(
                EbookIssued.issued_to== user_id,
                EbookIssued.status == True
            ).all()

            borrowed_books_ids = [book_id for (book_id,) in borrowed_books_ids]
            borrowed_books = Ebook.query.filter(Ebook.id.in_(borrowed_books_ids)).all()

            books_data = [{
                'id': book.id,
                'name': book.name,
                'author': book.author,
                'imageUrl': book.url,
            
                'summary': book.summary
            } for book in borrowed_books]

            return jsonify({'books': books_data})

        except Exception as e:
            print(f"Error fetching borrowed books: {e}")
            return jsonify({'error': 'Failed to fetch borrowed books.'}), 500
        
    @app.route('/fetch/bought_books/<int:user_id>', methods=['GET'])
    def fetch_bought_books(user_id):
        try:
            bought_books_ids = db.session.query(EbookIssued.issued_ebook).filter(
                EbookIssued.issued_to == user_id,
                EbookIssued.bought == True
            ).all()

            bought_books_ids = [book_id for (book_id,) in bought_books_ids]
            bought_books = Ebook.query.filter(Ebook.id.in_(bought_books_ids)).all()

            books_data = [{
                'id': book.id,
                'name': book.name,
                'author': book.author,
                'imageUrl': book.url,
                
                'summary': book.summary
            } for book in bought_books]

            return jsonify({'books': books_data})

        except Exception as e:
            print(f"Error fetching bought books: {e}")
            return jsonify({'error': 'Failed to fetch bought books.'}), 500
        
    @app.route('/download/<filename>')
    def download_file(filename):
        try:
          
            return send_from_directory('static/media/uploads/books/', filename)
        except FileNotFoundError:
            abort(404)
            
    @app.route('/profile/<int:user_id>', methods=['GET'])
    @roles_required('Reader')
    
    @cache.cached(timeout=300, key_prefix='profile_data_')
    def get_profile(user_id):
       
        user = User.query.get_or_404(user_id)
        
        borrowed_books = EbookIssued.query.filter_by(issued_to=user_id).order_by(EbookIssued.date_issued.desc()).all()
        
        stats = {
            'bought': sum(1 for book in borrowed_books if book.bought),
            'borrowed': sum(1 for book in borrowed_books if not book.bought),
            'monthlyData': []
        }

        now = datetime.now(pytz.timezone('Asia/Kolkata'))
        for i in range(6):
            month_start = now.replace(day=1, month=now.month - i, year=now.year)
            month_end = month_start.replace(day=1, month=now.month - i + 1) if now.month - i < 12 else month_start.replace(day=1, year=now.year - 1, month=1)
            count = EbookIssued.query.filter(EbookIssued.date_issued >= month_start, EbookIssued.date_issued < month_end, EbookIssued.issued_to == user_id).count()
            stats['monthlyData'].append({
                'month': month_start.strftime('%b %Y'),
                'count': count
            })

        user_data = {
            'id': user.id,
            'user': user.user,
            'fname': user.fname,
            'email': user.email,
            'active': user.active,
            'roles': [role.name for role in user.roles]
        }
        
        

        return jsonify({
            'user': user_data,
            'borrowed_books': [{
                'ebook_id': book.issued_ebook,
                'ebook_name': book.ebook.name, 
                'date_issued': book.date_issued.strftime('%Y-%m-%d'),
                'return_date': book.return_date.strftime('%Y-%m-%d') if book.return_date else 'N/A',
                'bought': book.bought
            } for book in borrowed_books],
            'stats': stats
        })

    @app.route('/profile/update', methods=['POST'])
    @roles_required('Reader')
    
    def update_user_profile():
        data = request.json
        user_id = data.get('id')
        user = User.query.filter_by(id=user_id).first()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        if 'user' in data and data['user'] != user.user:
            if User.query.filter_by(user=data['user']).first():
                return jsonify({'error': 'Username already taken'}), 400
            user.user = data['user']

        if 'email' in data and data['email'] != user.email:
            if User.query.filter_by(email=data['email']).first():
                return jsonify({'error': 'Email already taken'}), 400
            user.email = data['email']

        if 'fname' in data:
            user.fname = data['fname']

        if 'password' in data:
            user.password = hash_password(data['password'])
        cache.delete(f'profile_data_')
        db.session.commit()
        return jsonify({'success': 'Profile updated successfully'})
        
    @app.route('/api/books', methods=['POST'])
    def get_books_by_ids():
        try:
           
            request_data = request.get_json()
            ids = request_data.get('ids', [])
            
            if not ids:
                return jsonify({"error": "No book IDs provided"}), 400
            
            
            books = Ebook.query.filter(Ebook.id.in_(ids)).all()
            
         
            books_data = [
                {
                    "id": book.id,
                    "name": book.name,
                    "url": book.url,
                    "author": book.author,
                  
                    "summary": book.summary
                } for book in books
            ]
            
            return jsonify({"books": books_data}), 200
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @app.route('/api/admin/stats', methods=['GET'])
    @auth_required("token")
    @roles_required('Admin')
    def get_statistics():
        current_year = request.args.get('year', default=2024, type=int)
        period = request.args.get('period', default='week', type=str)  

        today = datetime.now()
        
        if period == 'week':
            start_date = today - timedelta(days=7)
        elif period == 'month':
            start_date = today - timedelta(days=30)
        elif period == 'year':
            start_date = today - timedelta(days=365)
        else:
            start_date = today - timedelta(days=30)  
        if period == 'week':
            previous_start_date = start_date - timedelta(days=7)
            previous_end_date = start_date - timedelta(days=1)
        elif period == 'month':
            previous_start_date = start_date - timedelta(days=30)
            previous_end_date = start_date - timedelta(days=1)
        elif period == 'year':
            previous_start_date = start_date - timedelta(days=365)
            previous_end_date = start_date - timedelta(days=1)
        else:
            previous_start_date = start_date - timedelta(days=30)  
            previous_end_date = start_date - timedelta(days=1)

      
        total_active_users = User.query.count()
        total_grant_requests = EbookIssued.query.filter_by(status=False,returned=False).count()
        total_books = Ebook.query.count()
        total_sections = Section.query.count()

        current_active_users = User.query.filter(User.created.between(start_date, today)).count()
     
        current_grant_requests= EbookIssued.query.filter((EbookIssued.date_issued.between(start_date, today))).count()
       

        previous_active_users = User.query.filter(User.created.between(previous_start_date, previous_end_date)).count()
        previous_grant_requests= EbookIssued.query.filter((EbookIssued.date_issued.between(previous_start_date, previous_end_date))).count()


        user_growth = current_active_users - previous_active_users
        request_growth = current_grant_requests - previous_grant_requests

        period_data = {
            'activeUsers': {
                'current': current_active_users,
                'previous': previous_active_users
            },
            'grantRequests': {
                'current': current_grant_requests,
                'previous': previous_grant_requests
            }
        }
        print(total_grant_requests)
        return jsonify({
            'activeUsers': total_active_users,
            'grantRequests': total_grant_requests,
            'totalBooks': total_books,
            'totalSections': total_sections,
            'userGrowth': user_growth,
            'requestGrowth': request_growth,
            'periodData': period_data
        })

    @app.route('/api/admin/ebook-issues', methods=['GET'])
  
    def get_ebook_issues():
        year = request.args.get('year', default=2024, type=int)

        results = (
            db.session.query(
                db.func.strftime('%m', EbookIssued.date_issued).label('month'),
                db.func.count(EbookIssued.id).label('count')
            )
            .filter(
                db.func.strftime('%Y', EbookIssued.date_issued) == str(year),
                EbookIssued.bought == False
            )
            .group_by('month')
            .all()
        )

        months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        data = {
            'labels': months,
            'datasets': [{
                'label': 'E-books Issued',
                'data': [0] * 12  
            }]
        }

        for result in results:
            month_index = int(result.month) - 1
            data['datasets'][0]['data'][month_index] = result.count
        print(data)

        return jsonify(data)
    
    @app.route('/api/admin/total-books', methods=['GET'])
    def get_total_books():
        bought_count = db.session.query(db.func.count(EbookIssued.id)).filter(EbookIssued.bought == True).scalar()
        borrowed_count = db.session.query(db.func.count(EbookIssued.id)).filter(EbookIssued.bought == False).scalar()

        data = {
            'labels': ['Bought', 'Borrowed'],
            'datasets': [{
                'label': 'Total Books',
                'data': [bought_count, borrowed_count],
                'backgroundColor': ['rgba(54, 162, 235, 0.2)', 'rgba(255, 99, 132, 0.2)'],
                'borderColor': ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
                'borderWidth': 1
            }]
        }

        return jsonify(data)


        return jsonify(data)
    @app.route('/api/admin/popular-sections', methods=['GET'])
  
    def fetch_popular_sections():

        section_counts = db.session.query(
            Section.name,
            db.func.count(EbookSection.section_id).label('count')
        ).join(
            EbookSection, Section.id == EbookSection.section_id
        ).join(
            EbookIssued, EbookSection.ebook_id == EbookIssued.issued_ebook
        ).group_by(
            Section.name
        ).order_by(
            db.func.count(EbookSection.section_id).desc()
        ).limit(5).all() 

        data = {
            'labels': [section for section, _ in section_counts],
            'datasets': [{
                'label': 'Top Sections',
                'data': [count for _, count in section_counts],
                'backgroundColor': 'rgba(153, 102, 255, 0.2)',
                'borderColor': 'rgba(153, 102, 255, 1)',
                'borderWidth': 1
            }]
        }

        return jsonify(data)

    @app.route('/api/users', methods=['GET'])
    @roles_required('Admin')
    @cache.cached(timeout=60*5, key_prefix='users_list', query_string=True)
    def get_users():
        search_query = request.args.get('search', '')
        sort_by = request.args.get('sort', 'name')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        reader_role = Role.query.filter_by(name='Reader').first()
        if not reader_role:
            return jsonify({'error': 'Reader role not found'}), 404

        query = db.session.query(User).join(UserRoles).filter(UserRoles.role_id == reader_role.id)

        if search_query:
            query = query.filter(User.fname.ilike(f'%{search_query}%'))

        if sort_by == 'created':
            query = query.order_by(User.created.desc())
        elif sort_by == 'username':
            query = query.order_by(User.user)
        else:
            query = query.order_by(User.fname)

        users = query.paginate(page=page, per_page=per_page).items

        users_list = [{
            'id': user.id,
            'name': user.fname,
            'username': user.user,
            'email': user.email,
            'created': user.created.isoformat()
        } for user in users]

        return jsonify(users_list)

    @app.route('/api/users/<int:user_id>', methods=['DELETE'])
    @roles_required('Admin')
    def delete_user(user_id):
        user = User.query.get_or_404(user_id)
        try:
            db.session.delete(user)
            db.session.commit()
            return jsonify({'message': 'User deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    @app.route('/api/ebooks/requests', methods=['GET'])
    @roles_required('Admin')
    def get_requested_books():
        
        requested_books = db.session.query(EbookIssued).filter_by(status=False, returned=False,bought=False).all()
        return jsonify([{
            'id': book.id,
            'title': book.ebook.name,
            'requester': book.user.user,
            'requested_date': book.date_issued.isoformat()
        } for book in requested_books])

    @app.route('/api/ebooks/requests/<int:book_id>', methods=['PUT'])
    @roles_required('Admin')
    def approve_request(book_id):
        book_request = EbookIssued.query.get(book_id)
        if not book_request:
            return jsonify({'error': 'Request not found'}), 404
        
        book_request.status = True
        book_request.issue_date = datetime.now(pytz.timezone('Asia/Kolkata'))
        db.session.commit()
        cache.delete("ebooks_history")
        return jsonify({'message': 'Request approved'})

    @app.route('/api/ebooks/requests/<int:book_id>', methods=['DELETE'])
    @roles_required('Admin')
    def deny_request(book_id):
        book_request = EbookIssued.query.get(book_id)
        if not book_request:
            return jsonify({'error': 'Request not found'}), 404
        
        db.session.delete(book_request)
        db.session.commit()
        cache.delete("ebooks_history")
        return jsonify({'message': 'Request denied'})

    @app.route('/api/ebooks/borrowed', methods=['GET'])
    @roles_required('Admin')
    def get_borrowed_books():
       
        borrowed_books = db.session.query(EbookIssued).filter_by(status=True, returned=False).all()
        return jsonify([{
            'id': book.id,
            'title': book.ebook.name,
            'borrower': book.user.user,
            'issue_date': book.date_issued.isoformat()
        } for book in borrowed_books])

    @app.route('/api/ebooks/borrowed/<int:book_id>', methods=['PUT'])
    @roles_required('Admin')
    def revoke_borrow(book_id):
        book_borrow = EbookIssued.query.get(book_id)
        if not book_borrow:
            return jsonify({'error': 'Borrow record not found'}), 404
        
        book_borrow.status = False
        book_borrow.returned = True
        db.session.commit()
        cache.delete("ebooks_history")
        return jsonify({'message': 'Borrow revoked'})

    @app.route('/api/ebooks/history', methods=['GET'])
    @roles_required('Admin')
    @cache.cached(timeout=300, key_prefix='ebooks_history')
    def get_history_records():
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 10))
            history_records = EbookIssued.query.paginate(page = page, per_page= per_page)
            records=[]
            for record in history_records.items:
                stat = record.status
                boug = record.bought
                ret = record.returned
                if boug == True:
                    status = "bought"
                else: 
                    if stat == True and ret==False:
                        status = "currently borrowed"
                    elif stat == False and ret ==False:
                        status = "requested"
                    elif stat == False and ret == True:
                        status = "previously borrowed"
                    else:
                        status = "no status"
            
                user = User.query.get(record.issued_to)
                book = Ebook.query.get(record.issued_ebook)

                record1= {
                    'id': record.id,
                    'name': user.user,
                    'ebook_title': book.name,
                    'date_borrowed': record.date_issued.strftime('%Y-%m-%d'),
                    'status': status,
                    
                    'return_date': record.return_date.strftime('%Y-%m-%d') if record.return_date else None
                }
                records.append(record1)
                print(records)

            return jsonify(records)
        except Exception as e:
            print(e)
            return jsonify({'error': str(e)}), 500
    
    


    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])


    @app.route('/api/sections', methods=['POST'])
    @roles_required('Admin')
    def create_section():
        data = request.get_json()
        new_section = Section(name=data['name'])
        db.session.add(new_section)
        db.session.commit()
        cache.delete("admin_sections")
        return jsonify(new_section.id), 201

    @app.route('/api/sections/<int:id>', methods=['PUT'])
    @roles_required('Admin')
    def update_section(id):
        data = request.get_json()
        section = Section.query.get_or_404(id)
        section.name = data['name']

        cache.delete("admin_sections")
        db.session.commit()
        return jsonify(section.id)

    @app.route('/api/sections/<int:id>', methods=['DELETE'])
    @roles_required('Admin')
    def delete_section(id):
        section = Section.query.get_or_404(id)
        db.session.delete(section)
        db.session.commit()
        cache.delete("admin_sections")
        return '', 204

    @app.route('/api/sections', methods=['GET'])
    @roles_required('Admin')
    @cache.cached(timeout=300, key_prefix='admin_sections')
    def get_sections():
        sections = Section.query.all()
        return jsonify([{'id': section.id, 'name': section.name, 'date_created': section.date_created} for section in sections])

    def generate_unique_id(existing_ids):
        
        def generate_random_id():
            return str(random.randint(1000000000, 9999999999)) 

        unique_id = generate_random_id()
        while unique_id in existing_ids:
            unique_id = generate_random_id()
        
        return unique_id

    @app.route('/api/ebooks', methods=['POST'])
    @roles_required('Admin')
    def create_ebook():
        data = request.form
        file = request.files.get('file')
        file2 = request.files.get('cover_image')
        
      
        existing_ids = {ebook.id for ebook in Ebook.query.all()}
        
       
        new_ebook_id = generate_unique_id(existing_ids)
        
        if file:
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], "books/"+filename))
            book_url = os.path.join(filename)
        else:
            filename = None
            book_url = None
        
        if file2:
            filename2 = secure_filename(file2.filename)
            file2.save(os.path.join(app.config['UPLOAD_FOLDER'], filename2))
            photo_url = os.path.join(filename2)
            print(photo_url)
        else:
            photo_url = None

        new_ebook = Ebook(
            id=new_ebook_id,
            name=data['name'],
            subname=data.get('subname'),
            summary=data['summary'],
            content=data['content'],
            author=data['author'],
            num_pages=data['num_pages'],
            url='/static/media/uploads/'+photo_url,
            bookurl=book_url
        )
        db.session.add(new_ebook)
        db.session.commit()


        section_ids = data.getlist('sections')
        for section_id in section_ids:
            ebook_section = EbookSection(ebook_id=new_ebook.id, section_id=section_id)
            db.session.add(ebook_section)
        db.session.commit()
        cache.delete('admin_ebooks')
        return jsonify(new_ebook.id), 201

    @app.route('/api/ebooks/<string:id>', methods=['PUT'])
    @roles_required('Admin')
    def update_ebook(id):
        data = request.form
        file = request.files.get('file')
        file2 = request.files.get('cover_image')
        ebook = Ebook.query.get_or_404(id)

        if file:
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], "books/"+filename))
            book_url = os.path.join("books", filename)
            ebook.bookurl = book_url
        if file2:
            filename2 = secure_filename(file2.filename)
            file2.save(os.path.join(app.config['UPLOAD_FOLDER'], filename2))
            photo_url = os.path.join(filename2)
            ebook.url = photo_url

        ebook.name = data['name']
        ebook.subname = data.get('subname', ebook.subname)
        ebook.summary = data['summary']
        ebook.content = data['content']
        ebook.author = data['author']
        ebook.num_pages = data['num_pages']

        EbookSection.query.filter_by(ebook_id=id).delete()
        section_ids = data.getlist('sections')
        for section_id in section_ids:
            ebook_section = EbookSection(ebook_id=ebook.id, section_id=section_id)
            db.session.add(ebook_section)
        cache.delete('admin_ebooks')
    
        db.session.commit()
        return jsonify(ebook.id), 200

    @app.route('/api/ebooks/<string:id>', methods=['DELETE'])
    @roles_required('Admin')
    def delete_ebook(id):
        ebook = Ebook.query.get_or_404(id)
        db.session.delete(ebook)
        db.session.commit()
        cache.delete('admin_ebooks')
        return '', 204

    @app.route('/api/ebooks', methods=['GET'])
    @roles_required('Admin')
    @cache.cached(timeout=300, key_prefix='admin_ebooks')
    def get_ebooks():
        ebooks = Ebook.query.all()
        
        for ebook in ebooks:
            for section in ebook.ebook_sections:
                print(section.section_id)
        return jsonify([
            {
                'id': ebook.id,
                'name': ebook.name,
                'subname': ebook.subname,
                'summary': ebook.summary,
                'content': ebook.content,
                'author': ebook.author,
                'num_pages': ebook.num_pages,
                'url': ebook.url,
                'bookurl': ebook.bookurl,
                'sections': [section.section_id for section in ebook.ebook_sections]
            }
            for ebook in ebooks
        ])



    @app.route('/delete_adult_section')
    def delete_adult_section():
        section_to_delete = Section.query.filter_by(name='adultery').first()
        
        if section_to_delete:
       
            section_id = section_to_delete.id
          
            db.session.query(EbookSection).filter_by(section_id=section_id).delete(synchronize_session=False)
            
            
            ebooks_to_delete = db.session.query(Ebook).join(EbookSection).filter(EbookSection.section_id == section_id).all()
            
            for ebook in ebooks_to_delete:
                db.session.delete(ebook)
            
          
            db.session.delete(section_to_delete)
         
            db.session.commit()
            
            return "Deleted records from ebook, ebooksection, and section where section is 'adult'."
        else:
            return "Section 'adult' not found."