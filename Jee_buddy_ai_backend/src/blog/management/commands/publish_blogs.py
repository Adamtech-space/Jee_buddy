from django.core.management.base import BaseCommand
from blog.models import BlogPost
from django.utils import timezone

class Command(BaseCommand):
    help = 'Publishes all unpublished blog posts'

    def handle(self, *args, **options):
        unpublished = BlogPost.objects.filter(is_published=False)
        count = unpublished.count()
        
        unpublished.update(is_published=True, published_at=timezone.now())
        
        self.stdout.write(self.style.SUCCESS(f'Successfully published {count} blog posts')) 