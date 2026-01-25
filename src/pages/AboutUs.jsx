import React from 'react';
import { Users, GraduationCap, Github, Linkedin, Mail } from 'lucide-react';
import '../styles/AboutUs.css';

const AboutUs = () => {
    const team = [
        {
            name: 'Abhijit Khole',
            role: 'Team Member',
            dept: 'E&CE Department',
            college: 'PICT, Pune',
            batch: 'Class of 2027',
            initials: 'AK'
        },
        {
            name: 'Pratik Kochare',
            role: 'Team Member',
            dept: 'E&CE Department',
            college: 'PICT, Pune',
            batch: 'Class of 2027',
            initials: 'PK'
        },
        {
            name: 'Arya Kadi',
            role: 'Team Member',
            dept: 'E&CE Department',
            college: 'PICT, Pune',
            batch: 'Class of 2027',
            initials: 'AK'
        }
    ];

    return (
        <div className="about-page">
            <div className="page-header">
                <div>
                    <h2 className="page-title">About The Team</h2>
                    <p className="page-subtitle">The minds behind SAARTHI Nexus</p>
                </div>
            </div>

            <div className="about-content">
                <div className="project-info card">
                    <h3><GraduationCap className="icon-primary" /> SAARTHI Nexus</h3>
                    <p>
                        Developed by the students of <strong>Pune Institute of Computer Technology (PICT)</strong>.
                        Our mission is to bridge the gap between academic learning and industry standards using AI-driven intelligence.
                    </p>
                </div>

                <h3 className="section-title">Meet the Developers</h3>

                <div className="team-grid">
                    {team.map((member, index) => (
                        <div key={index} className="team-card">
                            <div className="member-avatar">
                                {member.initials}
                            </div>
                            <h3 className="member-name">{member.name}</h3>
                            <div className="member-details">
                                <p className="detail-item">{member.dept}</p>
                                <p className="detail-item text-muted">{member.batch}</p>
                                <p className="detail-item text-sm">{member.college}</p>
                            </div>

                            <div className="social-links">
                                <button className="social-btn"><Github size={18} /></button>
                                <button className="social-btn"><Linkedin size={18} /></button>
                                <button className="social-btn"><Mail size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
