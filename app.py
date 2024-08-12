import csv
import sqlite3
from flask import Flask
import application.views as views
from application.models import Ebook, EbookSection, Review, UserRoles, db,security,User,Role,EbookIssued,Section
import pandas as pd
from flask_security import SQLAlchemyUserDatastore
from create_inital_data import create_data
from flask_migrate import Migrate
from application.models  import db
from application.models import Section
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from application.worker import celery_init_app
from celery.schedules import crontab
from application.tasks import daily_reminder, remind_return_due, send_monthly_report
from flask import Flask
from flask_caching import Cache



def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = "shh"
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///data.db"
    app.config['SECURITY_PASSWORD_SALT'] = 'password'
    app.config['EXPORT_DIR'] = 'static/media/uploads'
    app.config['SECURITY_TOKEN_AUTHENTICATION_HEADER'] = 'Authentication-Token'
    app.config['SECURITY_TOKEN_MAX_AGE'] = 3600 
    app.config['SECURITY_LOGIN_WITHOUT_CONFIRMATION'] = True
    app.config['UPLOAD_FOLDER'] = 'static/media/uploads'
    app.config['CACHE_TYPE'] = "RedisCache"
    app.config['CACHE_REDIS_HOST'] = 'localhost'
    app.config['CACHE_REDIS_PORT'] = 6379
    app.config['CACHE_REDIS_DB'] = 0
    app.config['CACHE_REDIS_URL'] = 'redis://localhost:6379/0'
    app.config['CACHE_DEFAULT_TIMEOUT'] = 300 
    UPLOAD_FOLDER = 'static/media/uploads'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    
    migrate = Migrate(app, db)
    
    cache = Cache(app)
    db.init_app(app)
    
    with app.app_context():
        user_datastore = SQLAlchemyUserDatastore(db, User, Role)
        security.init_app(app, user_datastore)
        
        # df = pd.read_csv('processed_books.csv')
        # categories = df['categories'].str.split(', ', expand=True).stack().unique()
        # for category in categories:
        #     if not Section.query.filter_by(name=category).first():  # Check if the category already exists
        #         new_section = Section(name=category)
        #         db.session.add(new_section)

        # with open('processed_books.csv', newline='', encoding='utf-8') as csvfile:
        #     reader = csv.DictReader(csvfile)
        #     for row in reader:
        #         try:
        #             # Create an Ebook instance
        #             ebook = Ebook(
        #                 id=row['isbn13'],
        #                 name=row['title'],
        #                 subname=row['subtitle'],
        #                 summary=row['description'],
        #                 content=row['description'],  # Assuming content is the same as description for simplicity
        #                 author=row['authors'],
        #                 num_pages=int(float(row['num_pages'])),
        #                 url=row['thumbnail']
        #             )
        #             db.session.add(ebook)

        #             # Find or create sections and create associations
        #             for category in row['categories'].split(', '):
        #                 section = Section.query.filter_by(name=category).first()
        #                 if not section:
        #                     section = Section(name=category)
        #                     db.session.add(section)
        #                 ebook_section = EbookSection(ebook_id=ebook.id, section_id=section.id)
        #                 db.session.add(ebook_section)

        #             # Commit the session to save the ebook and associations
        #             db.session.commit()
        #         except sqlite3.IntegrityError:
        #             db.session.rollback()
        #             print(f"Error adding {row['title']} - ISBN {row['isbn13']}")

        # print("Database population complete!")
        db.session.commit()
        

        admin = Admin(app, name='My App', template_mode='bootstrap3')
        admin.add_view(ModelView(User, db.session))
        admin.add_view(ModelView(Role, db.session))
        admin.add_view(ModelView(Ebook, db.session))
        admin.add_view(ModelView(EbookIssued, db.session))
        admin.add_view(ModelView(EbookSection, db.session))
        admin.add_view(ModelView(UserRoles, db.session))
        admin.add_view(ModelView(Section, db.session))
        admin.add_view(ModelView(Review, db.session))
        db.create_all()
       

        create_data(user_datastore)

    views.create_view(app,user_datastore,db,cache)
    return app
app = create_app()
celery_app = celery_init_app(app)

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):

    sender.add_periodic_task(
        crontab(hour=16, minute=15),
        daily_reminder.s("Daily Reminder", "Hello!\nPlease visit the Bibliotheca and check out our latest books!"),
    )
    sender.add_periodic_task(
        crontab(hour=16, minute=15),
        remind_return_due.s(),
    )
    sender.add_periodic_task(
        crontab(hour=16, minute=15, day_of_month=12),
        send_monthly_report.s(),
    )

        

if __name__ == "__main__":
    
    app.run(debug=True)