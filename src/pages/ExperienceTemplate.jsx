import React, { useState } from 'react';
import { Copy, Check, ArrowLeft } from 'lucide-react';
import '../styles/Dashboard.css'; // Just leveraging some universal styles

const ExperienceTemplate = () => {
    const [copied, setCopied] = useState(false);

    const templateContent = `## 🚀 Interview Experience Template

Welcome to your Interview Experience Guide! This template is here to help you share your journey in a way that's informative and exciting. Feel free to customize it as you wish and help future aspirants!

---

### 1. 🏢 **Company & Role**

*   **Company:** [Company Name] (e.g., Google, Microsoft, Startup X)
*   **Role:** [Job Title] (e.g., SDE Intern, Software Engineer, Data Scientist)
*   **Batch/Year of Graduation:** [Your Graduation Year] (e.g., 2024, 2023)
*   **Branch:** [Your Branch of Engineering] (e.g., Computer Science, IT, Electronics)

---

### 2. 📅 **Application Process**

*   **How did you apply?** (e.g., LinkedIn, Company Website, Referral, On-Campus)
*   **Timeline:**
    *   **Application Date:** [Date]
    *   **Online Assessment Date:** [Date] (if applicable)
    *   **Interview Dates:** [Date(s)]
    *   **Offer Date:** [Date] (if applicable)

---

### 3. 💬 **Interview Rounds**

#### Round 1: [Round Name] (e.g., Online Assessment, Technical Interview 1)
*   **Type:** [e.g., Coding, MCQ, Technical, HR]
*   **Description:** [Detailed description of the round. What kind of questions were asked? Coding problems, DSA concepts, System Design, Behavioral questions etc.]
    *   **Example Questions:**
        1.  [Question 1] 👨💻
        2.  [Question 2] 🧠
        3.  [Question 3] 🔥
*   **Difficulty Level:** [Easy, Medium, Hard]
*   **Your Experience:** [How did you perform? What was challenging? Tips for this round?]

#### Round 2: [Round Name] (e.g., Technical Interview 2, HR Round)
*   **Type:** [e.g., Coding, Technical, HR, Managerial]
*   **Description:** [Detailed description of the round]
    *   **Example Questions:**
        1.  [Question 1] 🔍
        2.  [Question 2] 💡
*   **Difficulty Level:** [Easy, Medium, Hard]
*   **Your Experience:** [Your performance and tips]

#### Round 3 (and subsequent rounds if any):

*   [Follow the same format as above for each round.]

---

### 4. 📊 **Overall Experience & Tips**

*   **Overall Interview Experience:** [How was your overall experience with the company? Positive, negative, or neutral?]
*   **What to prepare?** 💯 [List of topics to prepare for this company and role, e.g., DSA, System Design, specific technologies, behavioral questions.]
*   **Tips for Aspirants:** ✨ [Any general tips or advice for future candidates? Share your golden nuggets!]
*   **Verdict:** [Selected/Rejected/Waiting] (Optional)

---

### 5. 🖼️ **Add Images!**
![image](https://i.imgflip.com/9jbjc6.jpg)

Feel free to upload any image that showcases your interview experience—perhaps a photo of the company's office or your work environment. Visuals help make your experience even more relatable!

---

### 6. 📝 **Additional Comments (Optional)**

*   [Any other information you want to share, e.g., interviewer feedback, company culture insights, salary discussions, etc.]

---

### 💡 **Code Snippet Examples (Optional)**

Here's an example of a coding question you could include in your experience. Feel free to add some code snippets to demonstrate your problem-solving skills!

\`\`\`python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] < right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result
\`\`\`

---

Good Luck, and Remember: Stay Confident! 😎

**Note:** Be as detailed as possible, and don't forget to replace the bracketed placeholders with your actual interview details. The more info you provide, the more helpful your experience will be to others. 🙌
`;

    const handleCopy = () => {
        navigator.clipboard.writeText(templateContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="dash-page" style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto', background: '#0A0A0A', color: '#F5F5F5', minHeight: '100vh', fontFamily: 'inherit' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    🚀 Experience Markdown Template
                </h1>
                <p style={{ color: '#A3A3A3', margin: 0 }}>
                    Copy this template and paste it directly into the Markdown editor to easily structure your interview experience.
                </p>
            </div>

            <div style={{ background: '#111', border: '1px solid #2A2A2A', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#1A1A1A', borderBottom: '1px solid #2A2A2A' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#A3A3A3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Markdown Output
                    </span>
                    <button 
                        onClick={handleCopy}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)', color: copied ? '#22C55E' : '#F97316', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy Template'}
                    </button>
                </div>
                
                <div style={{ padding: '0' }}>
                    <textarea 
                        readOnly 
                        value={templateContent} 
                        style={{ width: '100%', height: '500px', background: 'transparent', border: 'none', padding: '24px', color: '#F5F5F5', fontSize: '14px', lineHeight: '1.6', fontFamily: 'monospace', resize: 'vertical', outline: 'none' }}
                    />
                </div>
            </div>

            <button 
                onClick={() => window.close()} 
                style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', color: '#A3A3A3', border: '1px solid #2A2A2A', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                <ArrowLeft size={16} /> Close Window
            </button>
        </div>
    );
};

export default ExperienceTemplate;
