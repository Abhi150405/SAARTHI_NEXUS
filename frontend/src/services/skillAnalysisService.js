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

// 2. Common Synonym Dictionary with normalized keys and aliases
const skillSynonyms = {
    'dsa': ['data structures', 'algorithms', 'data structures and algorithms', 'data structures & algorithms', 'dsa', 'data structure', 'algorithm', 'data structure and algorithm'],
    'cpp': ['c++', 'c plus plus', 'cpp', 'c/c++'],
    'c': ['c', 'c programming', 'c language'],
    'js': ['javascript', 'js', 'vanilla js'],
    'ts': ['typescript', 'ts'],
    'react': ['react', 'react.js', 'reactjs', 'react js', 'frontend'],
    'ml': ['machine learning', 'ml', 'ai', 'artificial intelligence', 'deep learning'],
    'sql': ['dbms', 'databases', 'database', 'rdbms', 'mysql', 'postgresql', 'oracle', 'sql', 'sql server', 'database management', 'database management system'],
    'networking': ['cn', 'computer networks', 'computer networking', 'networking'],
    'os': ['operating systems', 'os', 'operating system'],
    'oop': ['object oriented programming', 'object oriented', 'oop', 'oops', 'object-oriented programming'],
    'system design': ['system design', 'system architecture', 'hld', 'lld', 'high level design', 'low level design'],
    'cloud': ['cloud', 'cloud computing', 'aws', 'azure', 'gcp', 'google cloud'],
    'linux': ['linux', 'unix', 'shell scripting', 'bash'],
};

const normalizeSkill = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/[-_./\\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Smartly checks if a required skill is satisfied by a student's profile.
 * Normalized and robust against hyphens, acronyms, and synonyms.
 */
export function isSkillSatisfied(studentSkills, requiredSkill) {
    if (!studentSkills || !requiredSkill) return false;

    const reqRaw = requiredSkill.toLowerCase().trim();
    const reqNorm = normalizeSkill(requiredSkill);

    return studentSkills.some(studentSkill => {
        const studRaw = studentSkill.toLowerCase().trim();
        const studNorm = normalizeSkill(studentSkill);
        
        // Match 1: Exact Match (raw or normalized)
        if (studRaw === reqRaw || studNorm === reqNorm) return true;
        
        // Match 2: Substring Match
        if (studNorm.length > 2 && reqNorm.length > 2) {
            if (studNorm.includes(reqNorm) || reqNorm.includes(studNorm)) return true;
        }

        // Match 3: Synonym Groups (checks raw, normalized, and alias matches)
        for (const key in skillSynonyms) {
            const group = skillSynonyms[key];
            const hasStud = group.some(item => studNorm === normalizeSkill(item) || studRaw === item);
            const hasReq = group.some(item => reqNorm === normalizeSkill(item) || reqRaw === item);
            if (hasStud && hasReq) return true;
        }

        // Match 4: NLP Fuzzy Match (Similarity > 80%)
        if (getSimilarity(studNorm, reqNorm) > 0.8) return true;

        return false;
    });
}

