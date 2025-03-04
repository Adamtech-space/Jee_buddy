from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.admin.views.decorators import staff_member_required
from .Agent.blogen import schedule_blog_generation
import json

# Create your views here.
def index(request):
    return render(request, 'blog/index.html')

def blog_post(request, slug):
    return render(request, 'blog/blog_post.html', {'slug': slug})

@csrf_exempt
@staff_member_required
def generate_blog(request):
    """View to manually trigger blog generation"""
    if request.method in ['POST', 'GET']:  # Allow GET for testing
        try:
            success = schedule_blog_generation()
            if success:
                return JsonResponse({'status': 'success', 'message': 'Blog generation started successfully'})
            else:
                return JsonResponse({'status': 'error', 'message': 'Failed to generate blog'}, status=500)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'status': 'error', 'message': 'Only POST method is allowed'}, status=405)

def view_blogs(request):
    """View to list all blog posts"""
    from .models import BlogPost
    blogs = BlogPost.objects.all().order_by('-created_at')
    blog_list = [{"id": b.id, "title": b.title, "created_at": b.created_at} for b in blogs]
    return JsonResponse({"blogs": blog_list})


def latest_blogs(request):
    """View to get the 3 most recent blog posts"""
    from .models import BlogPost
    # Remove the is_published filter for testing
    latest_posts = BlogPost.objects.all().order_by('-created_at')[:3]
    
    posts_data = []
    for post in latest_posts:
        posts_data.append({
            "id": post.id,
            "title": post.title,
            "content": post.content[:500] + "..." if len(post.content) > 500 else post.content,  # Truncate content
            "created_at": post.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "author": post.author,
            "tags": post.tags,
            "is_published": post.is_published
        })
    
    return JsonResponse({"latest_posts": posts_data})