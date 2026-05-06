import { API_URL } from '../config';

export async function analyzeSkillGap(studentData, targetData) {
  const inputPayload = {
    student: {
      name: studentData.fullName || 'Student',
      branch: studentData.department || 'CE',
      cgpa: studentData.cgpa || 8.0,
      skills: studentData.skills || []
    },
    target: {
      type: targetData.type,        // "role" or "company"
      name: targetData.name,
      required_skills: targetData.required_skills
    }
  };

  const response = await fetch(`${API_URL}/api/skill-analysis/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inputPayload)
  });

  if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error: ${response.status}`;
      try {
          const parsed = JSON.parse(errorText);
          errorMessage = parsed.detail || errorMessage;
      } catch (e) {
          errorMessage = `${errorMessage} ${errorText}`;
      }
      throw new Error(errorMessage);
  }

  return response.json();
}

// Convert search_query → YouTube search URL
export function buildYouTubeSearchUrl(searchQuery) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
}

// NLP Helper: Levenshtein Distance for fuzzy matching
const getSimilarity = (a, b) => {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    if (longer.length === 0) return 1.0;
    
    const costs = [];
    for (let i = 0; i <= a.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= b.length; j++) {
            if (i === 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (a.charAt(i - 1) !== b.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[b.length] = lastValue;
    }
    return (longer.length - costs[b.length]) / longer.length;
};

// 2. Common Synonym Dictionary
const skillSynonyms = {
    'dsa': ['data structures', 'algorithms', 'data structures and algorithms', 'dsa'],
    'cpp': ['c++', 'c plus plus', 'cpp'],
    'js': ['javascript', 'js', 'vanilla js'],
    'react': ['react.js', 'reactjs', 'react js', 'frontend'],
    'ml': ['machine learning', 'ml', 'ai', 'artificial intelligence'],
    'sql': ['dbms', 'databases', 'database', 'rdbms', 'mysql', 'postgresql', 'oracle', 'sql', 'sql server', 'database management', 'database management system'],
    'networking': ['cn', 'computer networks', 'networking'],
    'os': ['operating systems', 'os', 'operating system'],
    'oop': ['object oriented programming', 'oop', 'oops'],
};

/**
 * Smartly checks if a required skill is satisfied by a student's profile.
 * This is 100% local and consumes 0 Gemini tokens.
 */
export function isSkillSatisfied(studentSkills, requiredSkill) {
    if (!studentSkills || !requiredSkill) return false;

    // 1. Normalization
    const req = requiredSkill.toLowerCase().trim();

    return studentSkills.some(studentSkill => {
        const stud = studentSkill.toLowerCase().trim();
        
        // Match 1: Precise Match
        if (stud === req) return true;
        
        // Match 2: Substring Match (e.g. "Full Stack Web Dev" satisfies "Web Dev")
        if (stud.includes(req) || req.includes(stud)) {
            if (stud.length > 2 && req.length > 2) return true;
        }

        // Match 3: NLP Fuzzy Match (Similarity > 80%)
        if (getSimilarity(stud, req) > 0.8) return true;

        // Match 4: Synonym Groups
        for (const key in skillSynonyms) {
            const group = skillSynonyms[key];
            if (group.includes(stud) && group.includes(req)) return true;
        }

        return false;
    });
}
