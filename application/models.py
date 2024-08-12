from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from flask_security import Security
from flask_security.models import fsqla_v3 as fsq
from datetime import datetime, timedelta
import pytz

security = Security()
db = SQLAlchemy()
fsq.FsModels.set_db_info(db)

class User(db.Model, UserMixin):
    
    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String(20), unique=True, nullable=False)
    fname = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    active = db.Column(db.Boolean, default=True)
    fs_uniquifier = db.Column(db.String(64), nullable=False)
    roles = db.relationship('Role', secondary='user_roles', backref=db.backref('users', lazy='dynamic'))
    created = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    last_login = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))
    
class UserBooks(db.Model):
    id = db.Column(db.Integer,primary_key=True)
    user_id = db.Column(db.String(13), db.ForeignKey('user.id'), nullable=False)
    ebook_id = db.Column(db.String(13), db.ForeignKey('ebook.id'), nullable=False)
    
class UserRoles(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))

class EbookSection(db.Model):
    __tablename__ = 'ebook_section'
    id = db.Column(db.Integer, primary_key=True)
    ebook_id = db.Column(db.String(13), db.ForeignKey('ebook.id'), nullable=False)
    section_id = db.Column(db.Integer, db.ForeignKey('section.id'), nullable=False)
    ebook = db.relationship('Ebook', backref=db.backref('ebook_sections', cascade='all, delete-orphan'))
    section = db.relationship('Section', backref=db.backref('section_ebooks', cascade='all, delete-orphan'))

class Ebook(db.Model):
    id = db.Column(db.String(13), primary_key=True) 
    name = db.Column(db.String(120), nullable=False) 
    subname = db.Column(db.String(120), nullable=True) 
    summary = db.Column(db.Text, nullable=False)  
    content = db.Column(db.Text, nullable=False)  
    author = db.Column(db.String(120), nullable=False)  
    num_pages = db.Column(db.Integer)  
    url = db.Column(db.String(1000), nullable=True, default="/default.png")  
    bookurl =db.Column(db.String(1000), nullable=True) 

class Section(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.now)

class EbookIssued(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    issued_ebook = db.Column(db.String(13), db.ForeignKey('ebook.id', name='fk_ebook'))
    ebook = db.relationship('Ebook', backref=db.backref("book", lazy=True))
    issued_to = db.Column(db.Integer, db.ForeignKey('user.id', name='fk_ebook_user'))
    user = db.relationship('User', backref=db.backref('ebooks', lazy=True))
    date_issued = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    return_date = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')) + timedelta(days=7))
    status = db.Column(db.Boolean, default=False)
    bought = db.Column(db.Boolean,default = False)
    returned = db.Column(db.Boolean,default= False)

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    ebook_id = db.Column(db.String(13), db.ForeignKey('ebook.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    user = db.relationship('User', backref=db.backref('reviews', lazy=True))
    ebook = db.relationship('Ebook', backref=db.backref('reviews', lazy=True))