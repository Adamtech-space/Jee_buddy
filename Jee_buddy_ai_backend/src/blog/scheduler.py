from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore
from django.conf import settings
from .Agent.blogen import schedule_blog_generation
import logging

logger = logging.getLogger(__name__)

# Create a global scheduler instance
scheduler = None

def start():
    global scheduler
    # Only start if scheduler is None (not already started)
    if scheduler is None:
        try:
            scheduler = BackgroundScheduler(settings.SCHEDULER_CONFIG)
            scheduler.add_jobstore(DjangoJobStore(), "default")
            
            # Schedule blog generation every minute for testing
            scheduler.add_job(
                schedule_blog_generation,
                'interval',
                days=3,  # Changed from days=3 to minutes=1 for testing
                name='generate_blog',
                jobstore='default',
                id='generate_blog',
                replace_existing=True
            )
            
            logger.info("Starting scheduler... Blog will be generated every minute for testing")
            scheduler.start()
        except Exception as e:
            logger.error(f"Error starting scheduler: {e}") 