import { Link } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import carImage from '../assets/car.svg';

export default function Footer() {
  const navigation = {
    main: [
      { name: 'Home', href: '/' },
      { name: 'Find Rides', href: '/rides' },
      { name: 'Offer a Ride', href: '/rides/create' },
      { name: 'My Rides', href: '/my-rides' },
      { name: 'Profile', href: '/profile' },
    ],
    company: [
      { name: 'About Us', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Terms & Conditions', href: '#' },
      { name: 'Privacy Policy', href: '#' },
    ],
    support: [
      { name: 'Help Center', href: '#' },
      { name: 'Safety', href: '#' },
      { name: 'Contact Us', href: '#' },
      { name: 'FAQ', href: '#' },
    ],
    social: [
      {
        name: 'GitHub',
        href: 'https://github.com/vipulbeniwal01/gotogether-client',
        icon: FaGithub,
      },
      {
        name: 'LinkedIn',
        href: 'https://www.linkedin.com/in/vipulbeniwal01',
        icon: FaLinkedin,
      },
      {
        name: 'Twitter',
        href: 'https://twitter.com/vipulbeniwal01',
        icon: FaTwitter,
      },
    ],
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <p className="text-center text-sm text-gray-500">
          © 2025 GoTogether. All rights reserved.
        </p>
      </div>
    </footer>
  );
} 