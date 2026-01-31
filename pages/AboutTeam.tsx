import React from 'react';
import { SparklesIcon, AlertCircleIcon, MapPinIcon, SearchIcon } from '../components/Icons';

const TEAM_MEMBERS = [
  { name: 'Manas', role: 'Project Lead & Developer' },
  { name: 'Venkat Ramesh', role: 'Core Developer' },
  { name: 'Hemanth', role: 'Core Developer' },
  { name: 'Yashetha', role: 'UI/UX Designer & Developer' },
  { name: 'Sai Pranathi', role: 'QA & Developer' },
];

const FEATURES = [
  {
    title: 'AI-Powered Matching',
    description: 'We use Google Gemini Vision to automatically analyze item photos and semantic matching to connect lost items with found reports instantly.',
    icon: <SparklesIcon className="w-6 h-6 text-white" />,
    color: 'bg-purple-500'
  },
  {
    title: 'Zero-Trust Security',
    description: 'Our unique "Challenge-Response" quiz and 4-digit PIN handshake protocol ensure that items are returned only to their verified owners.',
    icon: <AlertCircleIcon className="w-6 h-6 text-white" />,
    color: 'bg-red-500'
  },
  {
    title: 'Identity Shield',
    description: 'Automatic OCR technology detects and masks sensitive information like student IDs and phone numbers from public view to protect your privacy.',
    icon: <SearchIcon className="w-6 h-6 text-white" />,
    color: 'bg-blue-500'
  },
  {
    title: 'Campus Integrated',
    description: 'Built specifically for university life, integrating with campus maps, schedules, and security hubs for seamless retrieval.',
    icon: <MapPinIcon className="w-6 h-6 text-white" />,
    color: 'bg-green-500'
  }
];

const AboutTeam: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Team Section */}
      <div className="text-center mb-16">
        <h2 className="text-base font-semibold text-brand-600 tracking-wide uppercase">The Minds Behind CampusRetriever</h2>
        <p className="mt-1 text-4xl font-extrabold text-slate-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Meet Our Team
        </p>
        <p className="max-w-xl mx-auto mt-5 text-xl text-slate-500">
          We are a group of passionate students dedicated to solving the lost-and-found problem on campus using advanced AI and zero-trust security principles.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-24">
        {TEAM_MEMBERS.map((member) => (
          <div key={member.name} className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center hover:shadow-xl hover:border-brand-200 transition-all duration-300 transform hover:-translate-y-1">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center text-brand-600 text-3xl font-bold mb-6 ring-4 ring-white shadow-lg">
              {member.name.charAt(0)}
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{member.name}</h3>
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
              {member.role}
            </span>
            <p className="mt-4 text-sm text-slate-500">
              Contributing to build a smarter, safer, and more connected campus community.
            </p>
          </div>
        ))}
      </div>

      {/* Why CampusRetriever Section */}
      <div className="relative py-16 bg-white overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Why CampusRetriever?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500">
              Traditional lost and found boxes are outdated. We built a platform that is proactive, secure, and intelligent.
            </p>
          </div>

          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center text-center">
                <div className={`flex items-center justify-center h-12 w-12 rounded-xl ${feature.color} shadow-lg mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-base text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA Footer */}
      <div className="mt-16 bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
        <h3 className="text-lg font-medium text-slate-900">Want to join us?</h3>
        <p className="mt-2 text-slate-500">
          We are always looking for contributors to help improve the platform. Contact us at <a href="mailto:support@srmap.edu" className="text-brand-600 hover:underline">support@srmap.edu</a>.
        </p>
      </div>
    </div>
  );
};

export default AboutTeam;