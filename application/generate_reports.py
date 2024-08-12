import pdfkit
import pandas as pd
from datetime import datetime

from application.models import db, EbookIssued, Section, User




def generate_monthly_report():
    # Fetch data for the report
    today = datetime.today()
    start_date = today.replace(day=1)
    end_date = (today.replace(day=1) + pd.DateOffset(months=1)).replace(day=1)

    issued_ebooks = EbookIssued.query.filter(
        EbookIssued.issue_date.between(start_date, end_date)
    ).all()

    sections = Section.query.all()
    users = User.query.all()

    # Create an HTML template for the report
    report_html = '''
    <html>
    <head>
        <title>Monthly Report</title>
    </head>
    <body>
        <h1>Monthly Report</h1>
        <h2>Issued E-books</h2>
        <table border="1">
            <tr><th>Title</th><th>Issued Date</th><th>Return Date</th><th>User</th></tr>
            {issued_ebooks}
        </table>
        <h2>Sections</h2>
        <table border="1">
            <tr><th>Name</th></tr>
            {sections}
        </table>
        <h2>Users</h2>
        <table border="1">
            <tr><th>Username</th><th>Email</th></tr>
            {users}
        </table>
    </body>
    </html>
    '''

    issued_ebooks_html = ''.join(
        f'<tr><td>{ebook.title}</td><td>{ebook.issue_date}</td><td>{ebook.return_date}</td><td>{ebook.user.username}</td></tr>'
        for ebook in issued_ebooks
    )

    sections_html = ''.join(
        f'<tr><td>{section.name}</td></tr>'
        for section in sections
    )

    users_html = ''.join(
        f'<tr><td>{user.username}</td><td>{user.email}</td></tr>'
        for user in users
    )

    report_html = report_html.format(
        issued_ebooks=issued_ebooks_html,
        sections=sections_html,
        users=users_html
    )

    # Convert HTML to PDF
    pdf_path = '/path/to/monthly_report.pdf'
    pdfkit.from_string(report_html, pdf_path)

    return pdf_path