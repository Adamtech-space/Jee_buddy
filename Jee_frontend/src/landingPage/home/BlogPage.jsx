import { useState } from "react";
import { parseContent } from "../lib/contentParser";
import { formatDistance } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import blog1 from "../../assets/blog1.png";
import blog2 from "../../assets/blog2.png";
import blog3 from "../../assets/blog3.png";
import { motion } from "framer-motion";

// Using the actual JSON data
const samplePosts = [
  {
    id: 1,
    title: "Mastering the Chemistry Section of JEE Main: A Comprehensive Guide for Success",
    content: `Title: Mastering the Chemistry Section of JEE Main: A Comprehensive Guide for Success\n\nMeta Description: Uncover effective strategies, tips, and resources to excel in the Chemistry section of JEE Main. Understand Physical, Inorganic, and Organic Chemistry to secure your admission into India's premier engineering and architecture programs.\n\nIntroduction:\n\nThe Joint Entrance Examination (JEE) Main, India's national level competitive exam, paves the way for undergraduate admissions in engineering a...`,
    created_at: "2025-02-26 12:26:02",
    author: "AI Assistant",
    tags: "JEE, Exam Preparation, Study Tips",
    is_published: false
  },
  {
    id: 2,
    title: "Mastering the Chemistry Section of JEE Main: A Comprehensive Guide for Success",
    content: `Title: Mastering the Chemistry Section of JEE Main: A Comprehensive Guide for Success\n\nMeta Description: Uncover effective strategies, tips, and resources to excel in the Chemistry section of JEE Main. Understand Physical, Inorganic, and Organic Chemistry to secure your admission into India's premier engineering and architecture programs.\n\nIntroduction:\n\nThe Joint Entrance Examination (JEE) Main, India's national level competitive exam, paves the way for undergraduate admissions in engineering a...`,
    created_at: "2025-02-26 12:26:02",
    author: "AI Assistant",
    tags: "JEE, Exam Preparation, Study Tips",
    is_published: false
  },
  {
    id: 3,
    title: "Mastering the Chemistry Section of JEE Main: A Comprehensive Guide for Success",
    content: `Title: Mastering the Chemistry Section of JEE Main: A Comprehensive Guide for Success\n\nMeta Description: Uncover effective strategies, tips, and resources to excel in the Chemistry section of JEE Main. Understand Physical, Inorganic, and Organic Chemistry to secure your admission into India's premier engineering and architecture programs.\n\nIntroduction:\n\nThe Joint Entrance Examination (JEE) Main, India's national level competitive exam, paves the way for undergraduate admissions in engineering a...`,
    created_at: "2025-02-26 12:26:02",
    author: "AI Assistant",
    tags: "JEE, Exam Preparation, Study Tips",
    is_published: false
  }
];

export default function BlogPage() {
  const [posts] = useState(samplePosts);

  return (
    <div className="min-h-screen backdrop-blur-xl">
      {/* Enhanced Hero Section */}
      <div className="py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-400 mb-4">
            JEE Preparation Blog
          </h1>
          <p className="text-lg text-gray-600">
            Expert tips, study strategies, and exam insights
          </p>
        </div>
      </div>

      {/* Holographic Blog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.article 
              key={post.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/20 rounded-2xl p-6 backdrop-blur-xl border border-gray-800 hover:border-purple-400/30 transition-all duration-300"
            >
              {/* Image Container */}
              <div className="relative h-60 rounded-xl overflow-hidden mb-6">
                <img
                  src={[blog1, blog2, blog3][index]}
                  alt={post.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="space-y-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {post.tags.split(',').map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 rounded-full backdrop-blur-sm"
                    >
                      #{tag.trim()}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-200 bg-clip-text text-transparent">
                  {post.title}
                </h3>

                {/* Preview */}
                <p className="text-gray-400 line-clamp-3 text-sm leading-relaxed">
                  {post.content.split('\n').slice(0, 3).join(' ')}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-gray-400">{post.author}</span>
                  </div>
                  <span className="text-gray-500">
                    {formatDistance(new Date(post.created_at), new Date(), { addSuffix: true })}
                  </span>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(400px_at_50%_150px,#4f46e540_0%,transparent_80%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Read More */}
              <Link 
                href={`/post/${post.id}`}
                className="absolute inset-0 z-10"
              >
                <span className="sr-only">Read more</span>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
