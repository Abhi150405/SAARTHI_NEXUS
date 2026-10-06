import os
import ast
import re
import urllib.parse
import pandas as pd
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class CourseraService:
    def __init__(self):
        self.courses: List[Dict[str, Any]] = []
        self._is_loaded = False
        self._load_datasets()

    def _find_csv_path(self, filename: str) -> Optional[str]:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        candidates = [
            os.path.abspath(os.path.join(base_dir, "..", "..", filename)),
            os.path.join(os.getcwd(), filename),
            os.path.join(os.getcwd(), "backend", filename),
        ]
        for path in candidates:
            if os.path.exists(path):
                return path
        return None

    def _load_datasets(self):
        if self._is_loaded:
            return

        csv1_path = self._find_csv_path("Coursera_courses1.csv")
        csv2_path = self._find_csv_path("coursera_courses.csv")

        parsed_courses: List[Dict[str, Any]] = []
        seen_urls = set()

        # 1. Load detailed dataset (coursera_courses.csv)
        if csv2_path:
            try:
                df2 = pd.read_csv(csv2_path)
                for _, row in df2.iterrows():
                    url = str(row.get("course_url", "")).strip()
                    if not url or url in seen_urls:
                        continue
                    
                    title = str(row.get("course_title", "")).strip()
                    org = str(row.get("course_organization", "Coursera Partner")).strip()
                    difficulty = str(row.get("course_difficulty", "All Levels")).strip()
                    
                    try:
                        rating = float(row.get("course_rating", 4.5))
                        if pd.isna(rating):
                            rating = 4.5
                    except Exception:
                        rating = 4.5

                    skills = []
                    raw_skills = row.get("course_skills", "")
                    if pd.notna(raw_skills) and str(raw_skills).startswith("["):
                        try:
                            skills = [s.strip().lower() for s in ast.literal_eval(str(raw_skills))]
                        except Exception:
                            skills = []

                    seen_urls.add(url)
                    parsed_courses.append({
                        "title": title,
                        "url": url,
                        "organization": org,
                        "rating": rating,
                        "difficulty": difficulty,
                        "skills": skills,
                        "title_lower": title.lower(),
                        "platform": "Coursera",
                        "is_free": False,
                    })
            except Exception as e:
                logger.error(f"Error loading {csv2_path}: {e}")

        # 2. Load supplemental dataset (Coursera_courses1.csv)
        if csv1_path:
            try:
                df1 = pd.read_csv(csv1_path)
                for _, row in df1.iterrows():
                    url = str(row.get("course_url", "")).strip()
                    if not url or url in seen_urls:
                        continue
                    
                    title = str(row.get("name", "")).strip()
                    org = str(row.get("institution", "Coursera Partner")).strip()
                    
                    seen_urls.add(url)
                    parsed_courses.append({
                        "title": title,
                        "url": url,
                        "organization": org,
                        "rating": 4.6,
                        "difficulty": "All Levels",
                        "skills": [],
                        "title_lower": title.lower(),
                        "platform": "Coursera",
                        "is_free": False,
                    })
            except Exception as e:
                logger.error(f"Error loading {csv1_path}: {e}")

        self.courses = parsed_courses
        self._is_loaded = True
        logger.info(f"Loaded {len(self.courses)} verified Coursera courses into memory.")

    def search_courses(self, skill: str, limit: int = 2) -> List[Dict[str, Any]]:
        """
        Search verified Coursera courses for a given skill using synonym expansion,
        multi-stage relevance scoring, and rating boosts.
        """
        if not self._is_loaded or not self.courses:
            self._load_datasets()

        raw_query = skill.strip().lower()
        if not raw_query:
            return []

        # Synonym map for common college/placement engineering skills
        synonyms = {
            "dsa": ["data structures", "algorithms", "dsa", "data structure"],
            "cpp": ["c++", "c plus plus", "cpp"],
            "c": ["c programming", "c language"],
            "js": ["javascript", "js", "web development"],
            "react": ["react", "react.js", "frontend", "web development"],
            "angular": ["angular", "frontend", "web development"],
            "node": ["node.js", "nodejs", "backend", "web development"],
            "sql": ["sql", "database", "databases", "mysql", "postgresql", "rdbms"],
            "dbms": ["database", "databases", "sql", "rdbms", "database management"],
            "ml": ["machine learning", "deep learning", "artificial intelligence", "data science"],
            "ai": ["artificial intelligence", "machine learning", "deep learning"],
            "nlp": ["natural language processing", "nlp", "text mining"],
            "cv": ["computer vision", "image processing"],
            "networking": ["computer networking", "computer networks", "networking", "network"],
            "cn": ["computer networks", "computer networking", "networking"],
            "os": ["operating systems", "operating system"],
            "cloud": ["cloud computing", "aws", "azure", "google cloud", "devops"],
            "docker": ["docker", "containers", "kubernetes", "devops"],
            "git": ["git", "github", "version control"],
            "oop": ["object oriented", "java", "c++", "object-oriented programming"],
            "system design": ["software design and architecture", "software architecture", "system design", "distributed systems", "system architecture"],
            "linux": ["linux", "unix", "shell scripting", "bash", "operating systems"],
        }

        search_tokens = [raw_query]
        for key, aliases in synonyms.items():
            if raw_query == key or raw_query in aliases:
                search_tokens.extend(aliases)
        search_tokens = list(dict.fromkeys(search_tokens))  # Deduplicate while preserving order

        scored_courses = []

        # Irrelevant non-computing keywords to penalize
        irrelevant_keywords = ["solar", "fashion", "interior", "jewelry", "landscape", "dental", "music"]

        for c in self.courses:
            score = 0
            title_lower = c["title_lower"]
            skills = c["skills"]

            # Penalize irrelevant domains
            if any(irr in title_lower for irr in irrelevant_keywords):
                score -= 80

            for token in search_tokens:
                # 1. Exact title match
                if token == title_lower:
                    score = max(score, 120)
                # 2. Word boundary match in title
                elif re.search(r"\b" + re.escape(token) + r"\b", title_lower):
                    score = max(score, 70)
                # 3. Substring in title
                elif token in title_lower:
                    score = max(score, 40)

                # 4. Explicit tag match in course_skills
                for s in skills:
                    if token == s:
                        score = max(score, 60)
                    elif token in s:
                        score = max(score, 30)

            if score > 0:
                # Add quality weight from course rating
                final_score = score + c.get("rating", 4.0) * 2
                scored_courses.append((final_score, c))

        scored_courses.sort(key=lambda x: x[0], reverse=True)

        results = []
        for _, c in scored_courses[:limit]:
            results.append({
                "title": c["title"],
                "platform": "Coursera",
                "url": c["url"],
                "is_free": False,
                "organization": c.get("organization", "Coursera"),
                "rating": c.get("rating", 4.5),
                "difficulty": c.get("difficulty", "All Levels"),
            })

        # Guaranteed fallback if no specific course hits: verified Coursera Search URL
        if not results:
            encoded_query = urllib.parse.quote_plus(skill)
            results.append({
                "title": f"Coursera: {skill.title()} Learning Collection",
                "platform": "Coursera",
                "url": f"https://www.coursera.org/search?query={encoded_query}",
                "is_free": True,
                "organization": "Coursera",
                "rating": 4.8,
                "difficulty": "All Levels",
            })

        return results

coursera_service = CourseraService()
