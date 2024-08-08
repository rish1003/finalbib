
from flask_security import SQLAlchemyUserDatastore
from flask_security.utils import hash_password
from application.models import db
def create_data(user_datastore : SQLAlchemyUserDatastore):
    print("creating data")
   
    user_datastore.find_or_create_role(name = "Admin", description = "Administrator/Librarian")
    user_datastore.find_or_create_role(name = "Reader", description = "Regular User")
    print("weewpp")
    
    
    if not user_datastore.find_user(email = "admin@bibliotheca.in"):
        user_datastore.create_user(user= "librarian", email = "admin@bibliotheca.in", password = hash_password('pass'),active = True, roles=['Admin'])
    if not user_datastore.find_user(email = "rish1003@gmail.com"):
        user_datastore.create_user(user = "rish1003",email = "rish1003@gmail.com", password = hash_password('pass'),active = True, roles=['Reader'])
    if not user_datastore.find_user(email = "rish@gmail.com"):
        user_datastore.create_user(user = "rish",email = "rish@gmail.com", password = hash_password('pass'),active = True, roles=['Reader','Admin'])
    

    db.session.commit()
   