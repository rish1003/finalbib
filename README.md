"bibblliotheca" 
python3 -m venv myenv
pip install -r requirements.txt
pip freeze > requirements.txt
celery -A app:celery_app worker --loglevel=DEBUG -B