# Interview Experience: Anish Manwar

**Company:** PhonePe
**Role:** SDE
**Branch:** CS
**Batch:** 2023
**Date:** Mon Feb 17 2025 11:00:00 GMT+0000 (Coordinated Universal Time)
**Views:** 0

---

# 📌 My PhonePe Interview Experience

## Introduction
I’m an undergrad studying in my **fourth year of engineering in Computer Engineering** at **Pune Institute of Computer Technology**. As per every year, **PhonePe** visited our college with the golden opportunity of a **full-time SDE Role** at their prestigious organization. The drive was open to all **BE students** as long as they fulfilled the criteria for dream companies set by our college **TnP Cell**. Gritting my teeth, I went into what was a test of **sheer resolve and skills**.

## 📢 PPT (Pre-Placement Talk)
We had a **Pre-Placement Talk** open to all students where they thoroughly discussed the **company policies, values, use cases, tech stack, compensation, etc.**
I jotted down a few notes from the **PPT** for discussions in later interview rounds, especially the **HR round**. (**Bitter foreshadowing**)

## Round 1: Online Assessment
- The **Online Assessment** was held on **DoSelect Platform** early in the morning at **9 AM**.
- The test had **4 questions** and **90 minutes** to solve all of them with a score of **100 per question**.

### Problems:
1. **In an office of N lanes with desks of only prime lengths**, each team is supposed to sit in one lane. The length of the *ith* lane and the cost of laying one desk in the *ith* lane are represented by **2 arrays**. Find the **minimum total cost** to complete desking of all **N lanes**. *(Easily solvable with SPF and modular arithmetic.)*

2. **Rearrange an array of positive integers** to maximize the sum of **GCDs of adjacent elements** in the array. *(I managed to pass half the cases with next_permutation. The most optimal approach probably lies in bitmask DP.)*

3. **Maximize the members in a team** where the *ith* member will only join if **ai** members have strictly greater power than him and **bi** members have power less than him. *(I couldn’t solve this one; it's likely solvable with binary search on answer.)*

4. **Find the total number of ways** to execute all functions given that they can only be executed if a given function before them was previously executed. *(Didn’t get time to look into it much so can’t say.)*

I solved the **1st problem completely** and the **2nd one partially**.
**11 people** were shortlisted, including me, from the coding rounds for further evaluation.

## First Technical Interview Round
It was an **offline interview** which roughly lasted for **an hour**. The mode of the interview was **pen and paper**. The interviewer was rather **zealous and obliging**. It seemed as if he had **tons of experience** under his belt. He attempted to put me in **vulnerable situations** in even the **easiest problems** a lot.

He started by asking about **myself** a bit. Then, he asked if I had worked on a **project in any database**, to which I **agreed** and told him about one in **PHP and SQL**. We then discussed my project during my **summer internship** and my **overall experience** regarding the same.

He later insisted on continuing the interview with **Problem Solving / Data Structures questions**, to which I willingly agreed.

### Questions:
1. **Merge Two Sorted Arrays**
   - Given **two sorted arrays of integers**, merge them into a single sorted array. *(Easily done with two pointers.)*
   - Then he **scaled the problem to 10 arrays**. I suggested using a **hashmap, 10 pointers, priority queue, or a binary search tree**.
   - **Note:** He bugged me a lot with even the **smallest and unorthodox corner cases** not being included in my pseudocode. So always **start with requirement gathering and look out for corner cases** when approaching interview questions.

2. **Find the Pair with Maximum Product**
   - Given an **array of integers**, find the **pair with maximum product**. *(Easily solvable with 4 pointers.)*

He discussed a lot over the **complexities** of these approaches and if it is possible to **improve them further**, even over **average cases**.
Then, he asked if I had any questions for him, to which I responded by **asking a few regarding use cases of Contact Graphs in PhonePe**.

**6 people**, including me, made it to the **second round**.

## Second Technical Interview Round
It was an **offline interview** which roughly lasted for **45 minutes**. The mode of the interview was **pen and paper**. The interviewer was a bit **timid but knew a lot about problem-solving and competitive programming**.

He started by **asking me which direction** I wanted the interview to go (*either coding or development*), to which I responded with **coding**.

Then, he asked me about my **favorite data structure**.
**MY FIRST MISTAKE!** I responded with **graphs**, hoping for an extra impression. He asked me stuff about **Disjoint Set Union** and its complexities. I did manage to answer but **it shook my confidence and resolve** a lot in the end.

### Questions:
1. **Number of Ways to Cut a Land**
   - Given **a land with N x M plots**, there are **T known treasures** buried in some of them. You have **K sons**.
   - In one operation, you can either **cut the land vertically** and give all plots to the **left** of the cut to one of your sons or **cut the land horizontally** and give all plots **above** the cut to one of your sons.
   - **Basically this:**
     [Leetcode Problem](https://leetcode.com/problems/number-of-ways-of-cutting-a-pizza/)
   - **MY SECOND MISTAKE!** I **perceived the problem to be harder** than it ever was. I couldn’t answer further.

2. **Painters Painting a Roof**
   - **Alice and Bob** are two painters painting a **roof of N x M cells**.
   - Alice paints the roof **horizontally** in **A1, A2, ..., AN** and Bob paints it **vertically** in **B1, B2, ..., BM**.
   - **To find the bad cell count:** I answered with a **solution in binary search** with **O(N log M) Complexity**.

3. **Array Splitting Problem**
   - Literally this problem but **without the circular arrangement part**.
   - I answered with an **O(N) solution** by **sorting and splitting the array**.

**4 people** were selected from this round.
**Unfortunately, I got rejected.**

## 🎯 Conclusion
I got **rejected**, but the experience felt **worth the hassle**.
Thanks to **Competitive Programming**, I made it as far as I could.
The **drive was great overall**, my **skills, luck, and resolve weren’t enough**, and the **best candidates got their well-deserved roles**.