import React from 'react';
import { Users, GraduationCap, Github, Linkedin, Mail } from 'lucide-react';
import '../styles/AboutUs.css';
import AbhijitPhoto from '../assets/Abhijit_Khole.jpeg';
import AryaPhoto from '../assets/Arya_Kadi.jpeg';
import PratikPhoto from '../assets/Pratik_Kochare.jpg';

const AboutUs = () => {
    const team = [
        {
            name: 'Abhijit Khole',
            role: 'Team Member',
            dept: 'E&CE Department',
            college: 'PICT, Pune',
            batch: 'Class of 2027',
            photo: AbhijitPhoto,
            github: 'https://github.com/Abhi150405',
            email: 'abhijitkhole15@gmail.com'
        },
        {
            name: 'Pratik Kochare',
            role: 'Team Member',
            dept: 'E&CE Department',
            college: 'PICT, Pune',
            batch: 'Class of 2027',
            photo: PratikPhoto,
            github: 'https://github.com/thepratikpk',
            email: 'pratikkocharetnp@gmail.com'
        },
        {
            name: 'Arya Kadi',
            role: 'Team Member',
            dept: 'E&CE Department',
            college: 'PICT, Pune',
            batch: 'Class of 2027',
            photo: AryaPhoto,
            github: 'https://github.com/aryakadi',
            email: 'pictarya11@gmail.com'
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
                                <img src={member.photo} alt={member.name} />
                            </div>
                            <div className="team-card-content">
                                <h3 className="member-name">{member.name}</h3>
                                <div className="member-details">
                                    <p className="detail-item">{member.dept}</p>
                                    <p className="detail-item text-muted">{member.batch}</p>
                                    <p className="detail-item text-sm">{member.college}</p>
                                </div>

                                <div className="social-links">
                                    <a href={member.github} target="_blank" rel="noopener noreferrer" className="social-btn"><Github size={18} /></a>
                                    <button className="social-btn"><Linkedin size={18} /></button>
                                    <a href={`mailto:${member.email}`} className="social-btn"><Mail size={18} /></a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
