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
