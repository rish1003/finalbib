# tasks.py

import csv
from datetime import datetime, timedelta
import os
from application.models import Ebook, EbookIssued, Role, Section, User, UserRoles
import pdfkit
import pandas as pd
from datetime import datetime
from celery import Celery, shared_task
from flask import current_app
from smtplib import SMTP
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from application.models import db
import pdfkit
import pytz

SMTP_HOST = "172.23.16.1"
SMTP_PORT = 1025
SENDER_EMAIL = 'info@bibliotheca.com'
SENDER_PASSWORD = ''

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from reportlab.lib import colors
from application.models import EbookIssued, Section, User
from datetime import datetime
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Spacer, paragraph, Paragraph

def generate_monthly_report():
    # Fetch data for the report
    today = datetime.today()
    start_date = today.replace(day=1)
    end_date = (today.replace(day=1) + pd.DateOffset(months=1)).replace(day=1)

    issued_ebooks = EbookIssued.query.filter(
        EbookIssued.date_issued.between(start_date, end_date)
    ).all()

    sections = Section.query.all()
    users = User.query.all()
    
    # Create a PDF document
    pdf_path = 'static/media/uploads/reports/monthly_report.pdf'
    document = SimpleDocTemplate(pdf_path, pagesize=letter)

    # Prepare data for tables
    styles = getSampleStyleSheet()
    content = []
    heading_style = ParagraphStyle(
        name='Heading1',
        fontSize=18,
        fontName='Helvetica-Bold',
        spaceAfter=12
    )

    # Issued E-books
    title =Paragraph("Currently Issued Ebooks",style=heading_style)
    issued_ebooks_data = [
        ['Title', 'Issued Date', 'Return Date', 'User']
    ]
    for ebook in issued_ebooks:
        ebooks= ebook.issued_ebook
        ebok = Ebook.query.filter_by(id=ebooks).first()

        
        issued_ebooks_data.append([
            ebok.name,
            ebook.date_issued.strftime('%Y-%m-%d'),
            ebook.return_date.strftime('%Y-%m-%d'),
            ebook.user.user
        ])
    issued_ebooks_table = Table(issued_ebooks_data)
    issued_ebooks_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    content.append(title)
    content.append(issued_ebooks_table)
    content.append(Spacer(1, 0.5 * inch))

    

    # Users
    title2 =Paragraph("Current Users",style=heading_style)
    users_data = [['Username', 'Email']]
    for user in users:
        users_data.append([user.user, user.email])
    users_table = Table(users_data)
    users_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    content.append(title2)
    content.append(users_table)

    # Build PDF
    document.build(content)

    return pdf_path


def send_message(to, subject, content_body, attachment_paths=None):
    msg = MIMEMultipart()
    msg["To"] = to
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg.attach(MIMEText(content_body, 'html'))

    if attachment_paths:
        print("true")
        for attachment_path in attachment_paths:
            with open(attachment_path[0], "rb") as attachment:
                part = MIMEApplication(attachment.read(), Name=attachment_path[1])
                part['Content-Disposition'] = f'attachment; filename="{attachment_path[1]}"'
                msg.attach(part)

    with SMTP(host=SMTP_HOST, port=SMTP_PORT) as client:
        client.send_message(msg=msg)


@shared_task(ignore_result=False)
def daily_reminder(subject, body):
   
    tz = pytz.timezone('Asia/Kolkata')
    today_date = datetime.now(tz).date()
    
    reader_role = Role.query.filter_by(name='Reader').first()
    if not reader_role:
        return "No 'reader' role found"
   
    user_ids = UserRoles.query.filter_by(role_id=reader_role.id).with_entities(UserRoles.user_id).all()
    user_ids = [user_id for (user_id,) in user_ids]
  
    users = User.query.filter(User.id.in_(user_ids)).all()
    
    for user in users:
      
        last_login_date = user.last_login.date() if user.last_login else None
        
        if last_login_date != today_date:
            send_message(user.email, subject, body)
    
    return "OK"

@shared_task(ignore_result=False)
def send_monthly_report():
    # Generate the report
    pdf_path =generate_monthly_report()

    # Send the report via email
    recipient = 'admin@example.com'
    subject = 'Monthly Activity Report'
    body = 'Please find the attached monthly activity report.'
    send_message(
        to=recipient,
        subject=subject,
        content_body=body,
        attachment_paths=[(pdf_path, 'monthly_report.pdf')]
    )
    
@shared_task(ignore_result=False)
def remind_return_due():
    tz = pytz.timezone('Asia/Kolkata')
    today = datetime.now(tz).date()

    # Calculate reminder dates
    reminder_dates = {
        3: today + timedelta(days=3),
        2: today + timedelta(days=2),
        1: today + timedelta(days=1)
    }
    print(reminder_dates)
    ebooks = EbookIssued.query.all()
    for ebook in ebooks:
        print(ebook.return_date.date())
        for days,reminder_date in reminder_dates.items():
            if (ebook.return_date.date() == reminder_date):
                print("sent")
                user = ebook.user
                subject = f"Reminder: Your Book Return is Due Soon ({days} Day(s) Left)"
                body = f"Dear {user.user},\n\nThis is a reminder that the book '{ebook.ebook.name}' is due for return in {days} day(s) on {reminder_date}.\nPlease make sure to read it by that time as access will be revoked!.\n\nThank you!"
                send_message(user.email, subject, body)
    
           
    
    return "OK"

@shared_task
def export_ebooks_to_csv():
    print("hey")
    csv_file_path = os.path.join(current_app.config['EXPORT_DIR'], f'ebooks_export_{datetime.now().strftime("%Y%m%d%H%M%S")}.csv')
    
    # Query to get issued/returned/granted e-books
    ebooks = EbookIssued.query.all()  # Adjust the query based on your needs
    
    # Writing to CSV
    with open(csv_file_path, 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['eBook Name', "User", 'Content', 'Author(s)', 'Date Issued', 'Return Date', 'Status'])
        
        for ebook in ebooks:
            # Determine status
            if ebook.status:
                status = 'Borrowed'
            elif ebook.returned:
                status = 'Returned'
            elif ebook.bought:
                status = 'Bought'
            else:
                status = 'Requested'
            
            user = User.query.filter_by(id=ebook.issued_to).first()
                
            writer.writerow([
                ebook.ebook.name,
                user.user,
                ebook.ebook.content,
                ebook.ebook.author,
                ebook.date_issued.date(),
                ebook.return_date.date(),
                status
            ])
    
    # Notify the librarian
    subject = 'eBook Export Completed'
    body = f'The Ebook history has been attached to this mail.'
    send_message(to='admin@blibliotheca.com', subject=subject, content_body=body, attachment_paths=[(csv_file_path, 'ebooks_export.csv')])
    
    return {'status': 'Task completed!', 'download_url': f'{csv_file_path}'}