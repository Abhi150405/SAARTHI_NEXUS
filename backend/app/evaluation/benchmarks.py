# benchmarks.py
# Ground Truth data for model evaluation

RESUME_EXTRACTION_BENCHMARKS = [
    {
        "filename": "sample_resume_1.txt",
        "human_labels": {
            "skills": ["Python", "JavaScript", "React", "MongoDB", "Node.js", "Docker", "AWS"],
            "experience_years": 2,
            "education": "B.E. Computer Engineering, PICT",
            "key_achievements": 3
        }
    },
    {
        "filename": "sample_resume_2.txt",
        "human_labels": {
            "skills": ["Java", "Spring Boot", "MySQL", "Hibernate", "Microservices", "Jenkins", "Kubernetes"],
            "experience_years": 3,
            "education": "B.Tech IT, VJTI",
            "key_achievements": 4
        }
    }
]

SKILL_MATCHING_BENCHMARKS = [
    {
        "student_skills": ["Python", "DSA", "DBMS", "OS", "Networking"],
        "required_skills": ["Python", "Data Structures", "Algorithms", "SQL", "Computer Networks"],
        "expected_score": 100  # These are all synonyms/direct matches
    },
    {
        "student_skills": ["Java", "Spring", "Angular"],
        "required_skills": ["Python", "React", "Django"],
        "expected_score": 0    # No overlap
    },
    {
        "student_skills": ["React.js", "Node.js", "Firebase"],
        "required_skills": ["Frontend Development", "Backend", "Full Stack"],
        "expected_score": 60   # Partial/Conceptual overlap
    }
]

LLM_JUDGE_METRICS = [
    {"aspect": "Actionability", "target": 4.5},
    {"aspect": "Technical Relevance", "target": 4.8},
    {"aspect": "Clarity & Tone", "target": 4.2},
    {"aspect": "Hallucination Rate", "target": 0.05}
]
