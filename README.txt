NSTP LTS 1 REVIEW CHALLENGE — WEB VERSION
===========================================

FILES
- index.html              Main website
- styles.css              Responsive styling for desktop and mobile
- app.js                  Game logic, timer, scoring, randomization, leaderboard
- questions.js            46 Average/Difficult questions and explanations
- config.js               Supabase connection settings (blank by default)
- config.example.js       Example configuration
- supabase_setup.sql      SQL to create the shared class leaderboard

RUN LOCALLY
Open index.html in a modern browser. The quiz works without a server.
When Supabase is not configured, scores are stored only in the current browser/device.
For a leaderboard shared by all students, configure Supabase first.

ENABLE SHARED ONLINE CLASS LEADERBOARD
1. Create or open a Supabase project.
2. Open SQL Editor in Supabase.
3. Run the complete contents of supabase_setup.sql.
4. In Project Settings > API, copy the Project URL and anon/public key.
5. Open config.js and fill in:
   supabaseUrl: "https://YOUR-PROJECT.supabase.co",
   supabaseAnonKey: "YOUR_SUPABASE_ANON_PUBLIC_KEY"
   Keep tableName as "nstp_lts1_scores".
6. Save config.js.

IMPORTANT SECURITY NOTES
- Use only the Supabase anon/public key in this public website. NEVER put a service_role or secret key in config.js.
- The leaderboard is public: anyone who can access the website can view scores and submit a score.
- This basic public leaderboard does not verify student identity and does not prevent score spoofing. It is suitable for a practice reviewer, not official grading.
- Students should enter a consistent name and section. Only the best score per student/section is shown.
- The quiz itself remains playable without Supabase; the shared class leaderboard needs the Supabase setup.

PUBLISH USING GITHUB PAGES
1. Create a GitHub repository, e.g. nstp-lts1-review-challenge.
2. Upload all files in this folder to the repository root (including config.js after configuring it).
3. In the repository, open Settings > Pages.
4. Under Build and deployment, choose Deploy from a branch.
5. Select branch main and folder /(root), then Save.
6. Wait for GitHub Pages to publish. Share the generated https://USERNAME.github.io/REPOSITORY/ link and its QR code with students.

FEATURES
- Mobile-friendly responsive interface
- 46 questions: Average and Difficult only
- Questions based on the six LTS 1 modules and selected exam concepts, with additional application questions
- Random question order and randomized answer choices
- 20-second countdown per item
- 10 points per correct answer
- Answer reveal and explanation
- Automatic progression after 3 seconds; Continue button also available
- 10, 20, or all questions
- Filter by difficulty and module
- Student name and class/section
- Class leaderboard, filterable by section

PROJECT CONFIGURATION
The config.js file has already been filled with the Supabase Project URL and the publishable key you supplied.
The application sends this publishable key using the apikey header only (the current Supabase format).
Before publishing, run supabase_setup.sql in this project's Supabase SQL Editor.

CLASS / SECTION OPTIONS
- BSED 1- MATHEMATICS
- BSED 1 - SOCIAL STUDIES
- BECED 1-A

INSTRUCTOR DISPLAY
- CELITO JOE M. PERILLO
The class/section field is now a required dropdown to keep leaderboard section names consistent.
