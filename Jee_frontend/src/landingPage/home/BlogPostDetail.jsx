import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { parseContent } from "../lib/contentParser";
import { formatDistance } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function BlogPostDetail() {
  const [, params] = useRoute("/post/:id");
  const [post, setPost] = useState(null);

  useEffect(() => {
    // This will be replaced with an actual API call
    const mockPost = {
      id: Number(params?.id),
      title: "Mastering the Chemistry Section of JEE Main: A Comprehensive Guide for Success",
      content: `Title: Mastering the Chemistry Section of JEE Main
H1: Comprehensive Study Approach
H2: Understanding the Basics
Body: The Joint Entrance Examination (JEE) Main requires a systematic approach to master chemistry.
Body: Focus on fundamental concepts and their applications in real-world scenarios.`,
      created_at: "2025-02-26 12:26:02",
      author: "AI Assistant",
      tags: "JEE, Exam Preparation, Study Tips",
      is_published: true
    };
    setPost(mockPost);
  }, [params?.id]);

  if (!post) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Articles
        </Link>

        <article className="space-y-8">
          {/* Featured Image */}
          <div className="relative w-full aspect-[21/9]">
            <img
              src={`https://via.placeholder.com/1200x600/1a1a1a/ffffff?text=Featured+Image`}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover rounded-xl"
            />
          </div>

          {/* Tags */}
          <div className="flex gap-2">
            {post.tags.split(',').map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-800 text-purple-300"
              >
                {tag.trim()}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center space-x-4 text-gray-400">
            <p className="font-medium">{post.author}</p>
            <span>•</span>
            <p>{formatDistance(new Date(post.created_at), new Date(), { addSuffix: true })}</p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            {parseContent(post.content).map((element, idx) => {
              if (element.type === 'h1') {
                return <h1 key={idx} className="text-3xl font-bold mb-6 text-purple-400">{element.content}</h1>;
              }
              if (element.type === 'h2') {
                return <h2 key={idx} className="text-2xl font-semibold mb-4 text-pink-400">{element.content}</h2>;
              }
              return <p key={idx} className="text-gray-300 leading-relaxed mb-6">{element.content}</p>;
            })}
          </div>
        </article>
      </div>
    </div>
  );
}
