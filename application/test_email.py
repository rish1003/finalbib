from smtplib import SMTP
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

SMTP_HOST = "localhost"
SMTP_PORT = 1025  # MailHog's SMTP port
SENDER_EMAIL = 'aarushi.parida@xaviers.edu.in'
SENDER_PASSWORD = ''  # Leave blank if no password is needed

def send_message(to, subject, content_body, attachment_paths=None):
    msg = MIMEMultipart()
    msg["To"] = to
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg.attach(MIMEText(content_body, 'html'))

    if attachment_paths:
        for attachment_path in attachment_paths:
            with open(attachment_path[0], "rb") as attachment:
                part = MIMEApplication(attachment.read(), Name=attachment_path[1])
                part['Content-Disposition'] = f'attachment; filename="{attachment_path[1]}"'
                msg.attach(part)

    with SMTP(host=SMTP_HOST, port=SMTP_PORT) as client:
        client.send_message(msg=msg)
