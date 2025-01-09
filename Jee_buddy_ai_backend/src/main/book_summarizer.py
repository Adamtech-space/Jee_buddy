import streamlit as st
import os
from typing import Dict
import PyPDF2
from openai import OpenAI
from dotenv import load_dotenv
import tempfile

class BookSummarizer:
    def __init__(self):
        load_dotenv()
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
    def read_pdf(self, pdf_path: str) -> Dict[str, str]:
        """Extract text from PDF file and organize by chapters"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                # First pass: Get table of contents or identify chapter markers
                full_text = ""
                for page in pdf_reader.pages:
                    full_text += page.extract_text() + "\n"
                
                # Use GPT to identify book structure
                book_structure = self.analyze_book_structure(full_text)
                return book_structure
                
        except Exception as e:
            print(f"Error reading PDF: {e}")
            return {}

    def analyze_book_structure(self, text: str) -> Dict[str, str]:
        """Use GPT to analyze the overall book structure"""
        try:
            prompt = """Analyze this textbook content and:
            1. Identify all major chapters and their subtopics
            2. Create a structured outline of the content
            3. Note any key themes or recurring concepts
            4. Identify the relationships between different chapters
            
            Return the analysis as a structured dictionary with chapters as keys and their content as values.
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert at analyzing textbook structure and organization."},
                    {"role": "user", "content": f"{prompt}\n\nText: {text[:4000]}..."}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            return eval(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in book structure analysis: {e}")
            return {"Main Content": text}

    def create_comprehensive_summary(self, book_structure: Dict[str, str]) -> Dict[str, str]:
        """Create a comprehensive summary of the entire book"""
        comprehensive_summary = {}
        
        # First, get an overview of the entire book
        book_overview = self.generate_book_overview(book_structure)
        comprehensive_summary["Book Overview"] = book_overview
        
        # Then analyze each chapter in detail
        for chapter, content in book_structure.items():
            chapter_summary = self.analyze_chapter(chapter, content)
            comprehensive_summary[chapter] = chapter_summary
            
        return comprehensive_summary

    def generate_book_overview(self, book_structure: Dict[str, str]) -> str:
        """Generate an overview of the entire book"""
        chapters = list(book_structure.keys())
        overview_prompt = f"""Create a comprehensive overview of this textbook based on its chapters:
        {', '.join(chapters)}
        
        Include:
        1. Main themes and objectives
        2. How chapters relate to each other
        3. Learning progression through the book
        4. Key concepts that span multiple chapters
        5. Prerequisites and target audience
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert at creating educational content overviews."},
                    {"role": "user", "content": overview_prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error generating book overview: {e}")
            return ""

    def analyze_chapter(self, chapter: str, content: str) -> str:
        """Analyze a single chapter in detail"""
        chapter_prompt = f"""Analyze this chapter: {chapter}

        Provide a detailed breakdown including:
        1. CHAPTER OVERVIEW:
           - Main objectives
           - Key concepts
           - Prerequisites
        
        2. DETAILED CONTENT:
           - Major topics and subtopics
           - Important definitions
           - Key formulas and equations
           - Theoretical concepts
        
        3. PRACTICAL APPLICATIONS:
           - Solved examples
           - Practice problems
           - Real-world applications
        
        4. SUMMARY:
           - Important points to remember
           - Common misconceptions
           - Links to other chapters
        
        Content:
        {content}
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert textbook analyst and educator."},
                    {"role": "user", "content": chapter_prompt}
                ],
                temperature=0.4,
                max_tokens=2000
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error analyzing chapter: {e}")
            return ""

def main():
    st.set_page_config(page_title="Book Summarizer", page_icon="📚", layout="wide")
    
    st.title("📚 Book Summarizer AI")
    st.write("Upload your textbook PDF to get a comprehensive summary")

    # Initialize session state
    if 'summary' not in st.session_state:
        st.session_state.summary = None
    if 'processing' not in st.session_state:
        st.session_state.processing = False

    # File uploader
    uploaded_file = st.file_uploader("Choose a PDF file", type="pdf")

    if uploaded_file is not None:
        # Create progress bar
        progress_bar = st.progress(0)
        status_text = st.empty()

        if st.button("Generate Summary"):
            st.session_state.processing = True
            
            try:
                # Save the uploaded file temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                    tmp_file.write(uploaded_file.getvalue())
                    tmp_file_path = tmp_file.name

                # Initialize summarizer
                summarizer = BookSummarizer()
                
                # Update progress
                status_text.text("Reading PDF...")
                progress_bar.progress(20)

                # Read and analyze the book
                book_structure = summarizer.read_pdf(tmp_file_path)
                
                # Update progress
                status_text.text("Analyzing content...")
                progress_bar.progress(50)

                # Create comprehensive summary
                comprehensive_summary = summarizer.create_comprehensive_summary(book_structure)
                
                # Update progress
                status_text.text("Generating final summary...")
                progress_bar.progress(80)

                # Store the summary in session state
                st.session_state.summary = comprehensive_summary

                # Clean up the temporary file
                os.unlink(tmp_file_path)
                
                # Complete progress
                progress_bar.progress(100)
                status_text.text("Summary generated successfully!")

            except Exception as e:
                st.error(f"An error occurred: {str(e)}")
                st.session_state.processing = False
                return

        # Display the summary if it exists
        if st.session_state.summary:
            st.write("---")
            st.header("Book Summary")
            
            # Add a download button for the summary
            summary_text = ""
            for section, content in st.session_state.summary.items():
                summary_text += f"\n\n{'='*50}\n{section}\n{'='*50}\n\n{content}"
            
            st.download_button(
                label="Download Summary",
                data=summary_text,
                file_name="book_summary.txt",
                mime="text/plain"
            )

            # Display summary with expandable sections
            for section, content in st.session_state.summary.items():
                with st.expander(f"📖 {section}"):
                    st.markdown(content)

            # Add navigation sidebar
            st.sidebar.title("Navigation")
            for section in st.session_state.summary.keys():
                if st.sidebar.button(section):
                    st.session_state.current_section = section

if __name__ == "__main__":
    main()