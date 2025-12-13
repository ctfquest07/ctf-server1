import { useState } from 'react';
import './Documentation.css';

function Documentation() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'challenges', title: 'Challenge Types' },
    { id: 'teams', title: 'Team System' },
    { id: 'scoring', title: 'Scoring System' },
    { id: 'tools', title: 'Recommended Tools' },
    { id: 'faq', title: 'FAQ' }
  ];

  return (
    <div className="documentation-container">
      <div className="documentation-header">
        <h1>Documentation <span className="highlight">& Guides</span></h1>
        <p className="documentation-subtitle">Learn how to participate in pwngrid Horizon challenges</p>
      </div>

      <div className="documentation-content">
        <div className="documentation-sidebar">
          <ul className="documentation-nav">
            {sections.map(section => (
              <li key={section.id}>
                <button
                  className={activeSection === section.id ? 'active' : ''}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="documentation-main">
          {activeSection === 'getting-started' && (
            <section className="doc-section">
              <h2>Getting Started with pwngrid Horizon</h2>
              <p>
                Welcome to pwngrid Horizon! This guide will help you get started with our platform and begin solving cybersecurity challenges.
              </p>
              
              <h3>Creating an Account</h3>
              <p>
                To participate in challenges, you'll need to create an account:
              </p>
              <ol className="doc-list">
                <li>Click on the "Register" button in the navigation bar</li>
                <li>Fill out the registration form with your details</li>
                <li>Verify your email address (if required)</li>
                <li>Log in with your new credentials</li>
              </ol>
              
              <h3>Navigating the Platform</h3>
              <p>
                Once logged in, you'll have access to:
              </p>
              <ul className="doc-list">
                <li><strong>Challenges Page:</strong> Browse and attempt various cybersecurity challenges with pagination</li>
                <li><strong>Profile Page:</strong> Track your progress, points, and achievements</li>
                <li><strong>Leaderboard:</strong> See individual and team rankings (when enabled by admin)</li>
                <li><strong>Teams:</strong> Join or create teams for collaborative competition</li>
              </ul>
              
              <div className="doc-note">
                <strong>Note:</strong> Some features may be restricted based on your account type and permissions.
              </div>
            </section>
          )}

          {activeSection === 'challenges' && (
            <section className="doc-section">
              <h2>Challenge Types</h2>
              <p>
                pwngrid Horizon offers various types of cybersecurity challenges to test different skills:
              </p>
              
              <div className="challenge-type">
                <h3>Web Exploitation</h3>
                <p>
                  These challenges focus on finding and exploiting vulnerabilities in web applications, 
                  such as SQL injection, XSS, CSRF, and more.
                </p>
                <div className="challenge-example">
                  <strong>Example:</strong> Find a way to bypass authentication on a login page.
                </div>
              </div>
              
              <div className="challenge-type">
                <h3>Cryptography</h3>
                <p>
                  Test your knowledge of cryptographic algorithms, encryption/decryption techniques, 
                  and ability to break weak cryptographic implementations.
                </p>
                <div className="challenge-example">
                  <strong>Example:</strong> Decrypt a message that was encrypted using a custom algorithm.
                </div>
              </div>
              
              <div className="challenge-type">
                <h3>Forensics</h3>
                <p>
                  Analyze digital artifacts, recover deleted data, and find hidden information in files.
                </p>
                <div className="challenge-example">
                  <strong>Example:</strong> Extract hidden data from a corrupted image file.
                </div>
              </div>
              
              <div className="challenge-type">
                <h3>Reverse Engineering</h3>
                <p>
                  Analyze compiled programs to understand their functionality and find vulnerabilities.
                </p>
                <div className="challenge-example">
                  <strong>Example:</strong> Reverse engineer a binary to find the correct input that produces a specific output.
                </div>
              </div>
              
              <div className="challenge-type">
                <h3>Miscellaneous</h3>
                <p>
                  Challenges that don't fit into other categories, often involving a mix of skills.
                </p>
                <div className="challenge-example">
                  <strong>Example:</strong> Solve a puzzle that combines elements of steganography and cryptography.
                </div>
              </div>
            </section>
          )}

          {activeSection === 'teams' && (
            <section className="doc-section">
              <h2>Team System</h2>
              <p>
                pwngrid Horizon supports team-based competition where teams can compete together:
              </p>
              
              <h3>Creating and Joining Teams</h3>
              <ul className="doc-list">
                <li>Teams can have up to 2 members maximum</li>
                <li>Users can create new teams or join existing ones</li>
                <li>Team points are calculated by summing all members' individual points</li>
                <li>Both individual and team leaderboards are available</li>
              </ul>
              
              <h3>Team Competition</h3>
              <p>
                Team features include:
              </p>
              <ul className="doc-list">
                <li><strong>Shared Progress:</strong> Team points reflect combined member achievements</li>
                <li><strong>Team Leaderboard:</strong> Separate ranking system for teams</li>
                <li><strong>Collaborative Solving:</strong> Members can work together on challenges</li>
              </ul>
              
              <div className="doc-note">
                <strong>Note:</strong> Individual progress and points are maintained separately from team participation.
              </div>
            </section>
          )}

          {activeSection === 'scoring' && (
            <section className="doc-section">
              <h2>Scoring System</h2>
              <p>
                Understanding how points are awarded in pwngrid Horizon:
              </p>
              
              <h3>Point Allocation</h3>
              <p>
                Each challenge is assigned a point value based on its difficulty:
              </p>
              <ul className="doc-list">
                <li><strong>Easy:</strong> 50-150 points</li>
                <li><strong>Medium:</strong> 200-350 points</li>
                <li><strong>Hard:</strong> 400-600 points</li>
                <li><strong>Expert:</strong> 700-1000 points</li>
              </ul>
              
              <h3>Leaderboard Ranking</h3>
              <p>
                The platform features dual leaderboard systems:
              </p>
              <ul className="doc-list">
                <li><strong>Individual Leaderboard:</strong> Ranks users by their personal points</li>
                <li><strong>Team Leaderboard:</strong> Ranks teams by combined member points</li>
                <li>Only users with 'user' role appear on leaderboards (admins excluded)</li>
                <li>Leaderboard access can be enabled/disabled by administrators</li>
              </ul>
              
              <h3>Achievements</h3>
              <p>
                Special achievements may be awarded for:
              </p>
              <ul className="doc-list">
                <li>First blood (first to solve a challenge)</li>
                <li>Solving all challenges in a category</li>
                <li>Reaching certain point thresholds</li>
              </ul>
            </section>
          )}

          {activeSection === 'tools' && (
            <section className="doc-section">
              <h2>Recommended Tools</h2>
              <p>
                Having the right tools can make solving CTF challenges much easier. Here are some recommended tools for different challenge types:
              </p>
              
              <div className="tools-category">
                <h3>Web Exploitation</h3>
                <ul className="doc-list">
                  <li><strong>Burp Suite:</strong> Web vulnerability scanner and proxy</li>
                  <li><strong>OWASP ZAP:</strong> Open-source web application security scanner</li>
                  <li><strong>Firefox Developer Tools:</strong> Built-in browser tools for web analysis</li>
                  <li><strong>Postman:</strong> API testing and development</li>
                </ul>
              </div>
              
              <div className="tools-category">
                <h3>Cryptography</h3>
                <ul className="doc-list">
                  <li><strong>CyberChef:</strong> Web app for encryption, encoding, compression, and data analysis</li>
                  <li><strong>Hashcat:</strong> Advanced password recovery tool</li>
                  <li><strong>John the Ripper:</strong> Password cracking tool</li>
                  <li><strong>OpenSSL:</strong> Cryptography toolkit</li>
                </ul>
              </div>
              
              <div className="tools-category">
                <h3>Forensics</h3>
                <ul className="doc-list">
                  <li><strong>Wireshark:</strong> Network protocol analyzer</li>
                  <li><strong>Autopsy:</strong> Digital forensics platform</li>
                  <li><strong>ExifTool:</strong> Read, write and edit metadata</li>
                  <li><strong>Volatility:</strong> Memory forensics framework</li>
                </ul>
              </div>
              
              <div className="tools-category">
                <h3>Reverse Engineering</h3>
                <ul className="doc-list">
                  <li><strong>Ghidra:</strong> Software reverse engineering framework</li>
                  <li><strong>IDA Pro:</strong> Disassembler and debugger</li>
                  <li><strong>Radare2:</strong> Open-source reverse engineering framework</li>
                  <li><strong>GDB:</strong> GNU Debugger</li>
                </ul>
              </div>
              
              <div className="doc-note">
                <strong>Note:</strong> Always use these tools ethically and only on systems you have permission to test.
              </div>
            </section>
          )}

          {activeSection === 'faq' && (
            <section className="doc-section">
              <h2>Frequently Asked Questions</h2>
              
              <div className="faq-item">
                <h3>Do I need to be an expert to participate?</h3>
                <p>
                  No, we have challenges for all skill levels. Beginners can start with easy challenges and progress to more difficult ones as they learn.
                </p>
              </div>
              
              <div className="faq-item">
                <h3>Can I work in a team?</h3>
                <p>
                  Yes! You can create or join teams with up to 2 members. Team points are calculated by combining all members' individual scores.
                </p>
              </div>
              
              <div className="faq-item">
                <h3>Why can't I see the leaderboard?</h3>
                <p>
                  The leaderboard may be temporarily disabled by administrators. When disabled, you'll see a message indicating it's currently unavailable.
                </p>
              </div>
              
              <div className="faq-item">
                <h3>I'm stuck on a challenge. Can I get a hint?</h3>
                <p>
                  Some challenges may include hints that can be revealed. Additionally, you can check our community forums for discussions.
                </p>
              </div>
              
              <div className="faq-item">
                <h3>How often are new challenges added?</h3>
                <p>
                  We aim to add new challenges regularly. Follow our announcements for updates on new content.
                </p>
              </div>
              
              <div className="faq-item">
                <h3>Is it allowed to share solutions?</h3>
                <p>
                  We encourage learning and collaboration, but please don't publicly share solutions while a competition is active.
                </p>
              </div>
              
              <div className="faq-item">
                <h3>How can I report a bug or issue with a challenge?</h3>
                <p>
                  Use the Contact Us page to report issues, or contact administrators directly if you have their information.
                </p>
              </div>
              
              <div className="faq-item">
                <h3>What happens during a platform reset?</h3>
                <p>
                  A platform reset (admin only) clears all user points, marks all challenges as unsolved, and resets the leaderboard to a fresh state. This action is irreversible.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default Documentation;
