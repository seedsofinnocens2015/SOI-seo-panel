'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import SeoForm from './components/SeoForm';
import HrOpenings from './components/HrOpenings';
import HrApplications from './components/HrApplications';
import PanelUsers from './components/PanelUsers';
import { fetchManagedJobs } from '../lib/jobApi';
import { fetchManagedApplications } from '../lib/jobApplicationApi';
import { fetchSeo, fetchSeoStats, normalizePageUrl, saveSeo } from '../lib/seoApi';
import {
  clearAuthSession,
  getAuthToken,
  getStoredUser,
  requestLoginOtp,
  requestPasswordResetOtp,
  requestSignupOtp,
  resetPasswordWithOtp,
  saveAuthSession,
  verifyLoginOtp,
  verifySignupOtp,
} from '../lib/authApi';
import { BLOG_PAGE_TREE } from '../lib/blogPageTree';

const PAGE_TREE = [
  {
    label: 'Home',
    children: [
      { label: 'Home Page', value: '/' },

      {
        label: 'Home FAQs',
        children: [
          { label: 'Female FAQs', value: '/female-faqs' },
          { label: 'Genetic FAQs', value: '/genetic-faqs' },
          { label: 'Learning FAQs', value: '/learning-faqs' },
          { label: 'Male FAQs', value: '/male-faqs' },
        ],
      },
    ],
  },
  {
    label: 'Infertility Treatment',
    children: [
      {
        label: 'Fertility Treatments',
        children: [
          { label: 'IVF', value: '/fertility-treatments/ivf' },
          { label: 'ICSI', value: '/fertility-treatments/icsi' },
          { label: 'IUI', value: '/fertility-treatments/iui' },
          {
            label: 'Monitoring in an IUI Cycle',
            value: '/fertility-treatments/monitoring-in-an-iui-cycle-steps',
          },
          { label: 'Ovulation Induction', value: '/fertility-treatments/ovulation-induction' },
          { label: 'Follicular Monitoring', value: '/fertility-treatments/follicular-monitoring' },
          { label: 'Blastocyst Transfer', value: '/fertility-treatments/blastocyst-transfer' },
          { label: 'Secondary Infertility', value: '/fertility-treatments/secondary-infertility' },
        ],
      },
      {
        label: 'IVF Procedures & Preservation',
        children: [
          { label: 'Egg Freezing', value: '/ivf-procedures-preservation/egg-freezing' },
          { label: 'Embryo Freezing', value: '/ivf-procedures-preservation/embryo-freezing' },
          { label: 'Cryopreservation', value: '/ivf-procedures-preservation/cryopreservation' },
          { label: 'PRP & Ovarian Rejuvenation', value: '/ivf-procedures-preservation/prp' },
          { label: 'Surrogacy', value: '/ivf-procedures-preservation/surrogacy' },
          { label: 'Donor Program', value: '/ivf-procedures-preservation/donor-program' },
        ],
      },
      {
        label: 'Male Infertility Treatments',
        children: [
          {
            label: 'Male Infertility',
            value: '/male-infertility-treatments/male-infertility-treatment-in-india',
          },
          { label: 'TESA / PESA', value: '/male-infertility-treatments/tesa-pesa' },
          { label: 'MicroTESE', value: '/male-infertility-treatments/microtese' },
          { label: 'Semen Analysis', value: '/male-infertility-treatments/semen-analysis' },
          { label: 'Semen Analysis at Home', value: '/male-infertility-treatments/semen-analysis-at-home' },
          { label: 'Varicocele', value: '/male-infertility-treatments/varicocele' },
          { label: 'Vasectomy Reversal', value: '/male-infertility-treatments/vasectomy-reversal' },
        ],
      },
      {
        label: 'Male Fertility Conditions',
        children: [
          { label: 'Azoospermia', value: '/male-fertility-conditions/azoospermia' },
          {
            label: 'Non-Obstructive Azoospermia',
            value: '/male-fertility-conditions/non-obstructive-azoospermia',
          },
          {
            label: 'Obstructive Azoospermia',
            value: '/male-fertility-conditions/obstructive-azoospermia',
          },
          { label: 'Oligospermia', value: '/male-fertility-conditions/oligospermia' },
          {
            label: 'Blocked Seminiferous Tubules',
            value: '/male-fertility-conditions/blocked-seminiferous-tubules',
          },
          {
            label: 'Endocrinological Disorder in Men',
            value: '/male-fertility-conditions/endocrinological-disorder-in-men',
          },
          {
            label: 'Retrograde Ejaculation',
            value: '/male-fertility-conditions/retrograde-ejaculation',
          },
        ],
      },
      {
        label: 'Genetic Testing & Screening',
        children: [
          { label: 'Genetic Testing', value: '/genetic-testing-screening/genetic-testing' },
          { label: 'Genetic Factors', value: '/genetic-testing-screening/genetic-factors' },
          { label: 'PGT-A', value: '/genetic-testing-screening/pgt-a' },
          { label: 'PGT-M', value: '/genetic-testing-screening/pgt-m' },
          { label: 'PGT-SR', value: '/genetic-testing-screening/pgt-sr' },
          {
            label: 'Difference between PGT A & PGT-M',
            value: '/genetic-testing-screening/difference-between-pgt-a-and-pgt-m',
          },
          { label: 'Amniocentesis', value: '/genetic-testing-screening/amniocentesis' },
          {
            label: 'Chorionic Villus Sampling (CVS)',
            value: '/genetic-testing-screening/chorionic-villus-sampling-cvs',
          },
          {
            label: 'Couple Carrier Screening',
            value: '/genetic-testing-screening/couple-carrier-screening',
          },
          { label: 'Karyotyping', value: '/genetic-testing-screening/karyotyping' },
          { label: 'Microarray', value: '/genetic-testing-screening/microarray' },
          { label: 'HLA Matching', value: '/genetic-testing-screening/hla-matching' },
        ],
      },
      {
        label: 'Maternal–Fetal Medicine (MFM)',
        children: [
          { label: 'High-Risk Pregnancy', value: '/maternal-fetal-medicine/high-risk-pregnancy' },
          { label: 'Fetal Reduction', value: '/maternal-fetal-medicine/fetal-reduction' },
          {
            label: 'MFM Scans & Diagnostics',
            value: '/maternal-fetal-medicine/maternal-and-fetal-medicine',
          },
        ],
      },
      {
        label: 'Surgeries',
        children: [
          { label: 'Hysteroscopy', value: '/surgeries/hysteroscopy' },
          { label: 'Laparoscopy', value: '/surgeries/laparoscopy' },
          { label: 'Open Surgery', value: '/surgeries/open-surgery' },
        ],
      },
      {
        label: 'Reproductive Health Conditions',
        children: [
          {
            label: 'Blocked Fallopian Tubes',
            value: '/reproductive-health-conditions/blocked-fallopian-tubes',
          },
          {
            label: 'PCOS (Polycystic Ovarian Syndrome)',
            value: '/reproductive-health-conditions/pcos-vs-pmos',
          },
          {
            label: 'PCOD (Polycystic Ovarian Disease)',
            value: '/reproductive-health-conditions/polycystic-ovary-disease-pcod',
          },
          {
            label: 'Irregular Menstrual Cycle',
            value: '/reproductive-health-conditions/irregular-menstrual-cycle',
          },
          {
            label: 'Diabetes, Thyroid and Obesity',
            value: '/reproductive-health-conditions/diabetes-thyroid-and-obesity',
          },
          { label: 'Endometrial and Ovarian', value: '/reproductive-health-conditions/endometrial-and-ovarian' },
          { label: 'Endometriosis', value: '/reproductive-health-conditions/endometriosis' },
          {
            label: 'Fibroids, Polyps and Adenomyosis',
            value: '/reproductive-health-conditions/fibroids-polyps-and-adenomyosis',
          },
          {
            label: 'Female Genital Tuberculosis',
            value: '/reproductive-health-conditions/female-genital-tuberculosis',
          },
          {
            label: 'Recurrent Miscarriages',
            value: '/reproductive-health-conditions/recurrent-miscarriages',
          },
          {
            label: 'Why Delayed Periods But Not Pregnant',
            value: '/reproductive-health-conditions/reasons-for-delayed-periods-but-not-pregnant',
          },
          {
            label: 'Ovarian Hyperstimulation Syndrome (OHSS)',
            value: '/reproductive-health-conditions/ovarian-hyperstimulation-syndrome-ohss',
          },
        ],
      },
      {
        label: 'Fertility Wellness',
        children: [
          {
            label: 'Boost Fertility With Colours Of Food',
            value: '/fertility-wellness/how-to-boost-up-fertility-with-the-colours-of-food',
          },
          {
            label: 'Yoga For Fertility',
            value: '/fertility-wellness/yoga-for-fertility',
          },
        ],
      },
    ],
  },
  {
    label: 'IVF Centres',
    children: [
      {
        label: 'India',
        children: [
          { label: 'India', value: '/best-ivf-centre-in-india' },
          {
            label: 'Delhi',
            children: [
              { label: 'Delhi Overview', value: '/best-ivf-centre-in-delhi' },
              { label: 'Malviya Nagar, New Delhi', value: '/delhi/best-ivf-centre-in-malviyanagar/' },
              { label: 'Pitampura, New Delhi', value: '/delhi/best-ivf-centre-in-pitampura/' },
              { label: 'Janakpuri, New Delhi', value: '/delhi/best-ivf-centre-in-janakpuri/' },
            ],
          },
          {
            label: 'Uttar Pradesh',
            children: [
              { label: 'Uttar Pradesh Overview', value: '/best-ivf-centre-in-uttar-pradesh' },
              { label: 'Ghaziabad', value: '/uttar-pradesh/best-ivf-centre-in-ghaziabad/' },
              { label: 'Lucknow', value: '/uttar-pradesh/best-ivf-centre-in-lucknow/' },
              { label: 'Agra', value: '/uttar-pradesh/best-ivf-centre-in-agra/' },
              { label: 'Gorakhpur', value: '/uttar-pradesh/best-ivf-centre-in-gorakhpur/' },
              { label: 'Kanpur', value: '/uttar-pradesh/best-ivf-centre-in-kanpur/' },
              { label: 'Meerut', value: '/uttar-pradesh/best-ivf-centre-in-meerut/' },
            ],
          },
          {
            label: 'Bihar',
            children: [
              { label: 'Bihar Overview', value: '/best-ivf-centre-in-bihar' },
              { label: 'Patna', value: '/bihar/best-ivf-centre-in-patna/' },
              { label: 'Muzaffarpur', value: '/bihar/best-ivf-centre-in-muzaffarpur/' },
            ],
          },
          {
            label: 'Haryana',
            children: [
              { label: 'Haryana Overview', value: '/best-ivf-centre-in-haryana' },
              { label: 'Faridabad', value: '/haryana/best-ivf-centre-in-faridabad/' },
              { label: 'Gurugram', value: '/haryana/best-ivf-centre-in-gurugram/' },
            ],
          },
          {
            label: 'Jharkhand',
            children: [
              { label: 'Jharkhand Overview', value: '/best-ivf-centre-in-jharkhand' },
              { label: 'Ranchi', value: '/jharkhand/best-ivf-centre-in-ranchi/' },
              { label: 'Dhanbad', value: '/jharkhand/best-ivf-centre-in-dhanbad/' },
              { label: 'Bokaro', value: '/jharkhand/best-ivf-centre-in-bokaro/' },
            ],
          },
          {
            label: 'Uttarakhand',
            children: [
              { label: 'Uttarakhand Overview', value: '/best-ivf-centre-in-uttarakhand' },
              { label: 'Haldwani', value: '/uttarakhand/best-ivf-centre-in-haldwani/' },
            ],
          },
          {
            label: 'Assam',
            children: [
              { label: 'Assam Overview', value: '/best-ivf-centre-in-assam' },
              { label: 'Guwahati', value: '/assam/best-ivf-centre-in-guwahati/' },
            ],
          },
          {
            label: 'Kerala',
            children: [
              { label: 'Kerala Overview', value: '/best-ivf-centre-in-kerala' },
              { label: 'Kasaragod', value: '/kerala/best-ivf-centre-in-kasaragod/' },
              { label: 'Kochi', value: '/kerala/best-ivf-centre-in-kochi/' },
            ],
          },
          {
            label: 'Jammu & Kashmir',
            children: [
              { label: 'J&K Overview', value: '/best-ivf-centre-in-jammu-kashmir' },
              { label: 'Srinagar', value: '/jammu-kashmir/best-ivf-centre-in-srinagar/' },
              { label: 'Jammu', value: '/jammu-kashmir/best-ivf-centre-in-jammu/' }
            ],
          },
          {
            label: 'West Bengal',
            children: [
              { label: 'West Bengal Overview', value: '/best-ivf-centre-in-west-bengal' },
              { label: 'Kolkata', value: '/west-bengal/best-ivf-centre-in-kolkata/' },
            ],
          },
          {
            label: 'International',
            children: [
              { label: 'International', value: '/best-ivf-centre-in-international' },
              { label: 'Mabela, Muscat, Oman', value: '/best-ivf-centre-in-mabela-muscat' },
              { label: 'Cameroon, Central Africa', value: '/best-ivf-centre-in-cameroon' },
              { label: 'Sri Lanka', value: '/best-ivf-centre-in-sri-lanka' },
              { label: 'Bangladesh', value: '/best-ivf-centre-in-bangladesh' },
            ],
          },
        ],
      },
    ],
  },
  {
    label: 'International Patients',
    children: [
      { label: 'Patient Concierge', value: '/international-patients/patient-concierge' },
      { label: 'Travel Support', value: '/international-patients/travel-support' },
      { label: 'International Pricing', value: '/international-patients/international-pricing' },
      { label: 'Contact Team', value: '/international-patients/contact-team' },
    ],
  },
  {
    label: 'Resources',
    children: [
      { label: 'IVF Process / Patient Journey', value: '/resources/ivf-process-patient-journey' },
      { label: 'FAQs', value: '/resources/faqs' },
      { label: 'Patient Testimonial Videos', value: '/resources/patient-testimonial-videos' },
      { label: 'Fertility Calculator', value: '/resources/fertility-calculator' },
    ],
  },
  {
    label: 'About Us',
    children: [
      { label: 'Our Story', value: '/about/our-story' },
      // { label: 'Dr. Gauri Agrawal – Founder', value: '/ivf-doctor/dr-gauri-agarwal-ivf-specialist/' },
      { label: 'Leadership Team', value: '/about/leadership-team' },
      { label: 'Vision, Mission & Values', value: '/about/vision-mission-values' },
      { label: 'Success Rates', value: '/about/success-rates' },
      { label: 'Embryology Lab & Technology', value: '/about/embryology-lab-technology' },
      { label: 'Media & Press', value: '/about/media-press' },
      { label: 'Awards & Accreditations', value: '/about/awards-accreditations' },
    ],
  },
  {
    label: 'Doctors',
    children: [
      { label: 'Doctors', value: '/best-ivf-doctor-in-india' },
      { label: 'All IVF Specialists', value: '/ivf-doctor' },
            {
        label: 'All IVF Specialists - Profiles',
        children: [
          { label: 'Dr. Gauri Agarwal', value: '/ivf-doctor/dr-gauri-agarwal-ivf-specialist' },
          { label: 'Dr. Alpana Razadan', value: '/genetic-expert/dr-alpana-razadan' },
          { label: 'Dr. Lisha Singh', value: '/ivf-doctor/dr-lisha-singh-ivf-specialist' },
          { label: 'Dr. Monika Maan', value: '/ivf-doctor/dr-monika-mann-ivf-specialist' },
          { label: 'Dr. Pratik Kakani', value: '/ivf-doctor/dr-pratik-kakani-gynae-endoscopy' },
          { label: 'Dr. Disha Datta', value: '/ivf-doctor/dr-disha-datta-choudhury-ivf-specialist' },
          { label: 'Dr. Aiman Akram', value: '/ivf-doctor/dr-aiman-akram-ivf-specialist' },
          { label: 'Dr. Nivedita Nehal', value: '/ivf-doctor/dr-nivedita-nehal-ivf-specialist' },
          { label: 'Dr. Britika Prakash', value: '/ivf-doctor/dr-britika-prakash-ivf-specialist' },
          { label: 'Dr. Preeti', value: '/ivf-doctor/dr-preeti-ivf-specialist' },
          { label: 'Dr. Varkha Chandra', value: '/ivf-doctor/dr-varkha-chandra-ivf-specialist' },
          { label: 'Dr. Debilina Roy', value: '/ivf-doctor/dr-debilina-roy-ivf-specialist' },
          { label: 'Dr. Sanjana Singh', value: '/ivf-doctor/dr-sanjana-singh-ivf-specialist' },
          { label: 'Dr. Aditi Bhatnagar', value: '/ivf-doctor/dr-aditi-bhatnagar-ivf-specialist' },
          { label: 'Dr. Beena Upadhyay', value: '/ivf-doctor/dr-beena-upadhyay-ivf-specialist' },
          { label: 'Dr. Kriti Prasad', value: '/ivf-doctor/dr-kriti-prasad-ivf-specialist' },
          { label: 'Dr. Pallavi Shrivastava', value: '/ivf-doctor/dr-pallavi-shrivastava-ivf-specialist' },
          { label: 'Dr. Julie Chhawchharia', value: '/ivf-doctor/dr-julie-chhawchharia-ivf-specialist' },
          { label: 'Dr. Vinod Kumar B', value: '/ivf-doctor/dr-vinod-kumar-b-ivf-specialists' },
          { label: 'Dr. Sonia Raju', value: '/ivf-doctor/dr-sonia-raju-aluvilayil-ivf-specialist' },
          { label: 'Dr. Jasna Mohammed', value: '/ivf-doctor/dr-jasna-mohammed-ivf-specialist' },
          { label: 'Dr. Sneha Narayan', value: '/ivf-doctor/dr-sneha-narayan-ivf-specialist' },
          { label: 'Dr. Adrija Ghosal', value: '/ivf-doctor/dr-adrija-ghosal-ivf-specialist' },
          { label: 'Dr. Rashmi Singh', value: '/ivf-doctor/dr-rashmi-singh-ivf-specialist' },
          { label: 'Dr. Mangla Kawade', value: '/ivf-doctor/dr-mangla-kawade-ivf-specialist' },
          { label: 'Dr. Manisha', value: '/ivf-doctor/dr-manisha-ivf-specialist/' },
          { label: 'Dr Sunita Jamwal', value: '/ivf-doctor/dr-sunita-ivf-specialist/' },
          { label: 'Dr Ayushi Agarwal', value: '/ivf-doctor/dr-ayushi-agarwal-ivf-specialist/' },
        ],
      },
      { label: 'Maternal-Fetal Medicine Specialists', value: '/ivf-doctor/maternal-fetal-medicine' },
      { label: 'Surgeon Panel', value: '/ivf-doctor/surgeon-panel' },
    ],
  },
  {
    label: 'Contact Us',
    children: [
      { label: 'Book Appointment', value: '/contact/book-appointment' },
      { label: 'Online Payment', value: '/contact/online-payment' },
      { label: 'WhatsApp', value: '/contact/whatsapp' },
      { label: 'Call Back Form', value: '/contact/call-back-form' },
      { label: 'Centre Locator', value: '/contact/centre-locator' },
      { label: 'Careers', value: '/contact/careers' },
      { label: 'Careers – Apply', value: '/contact/careers/apply' },
      { label: 'Careers – General Application', value: '/contact/careers/general-application' },
      { label: 'Feedback', value: '/contact/feedback' },
    ],
  },
  {
    label: 'Training Academy',
    children: [
      // { label: 'Training Programs Academy', value: '/training-academy' },
      {
        label: 'Andrology Technician Training Program',
        value: '/training-academy/andrology-technician-training-program',
      },
      { label: 'Embryo Biopsy Training Program', value: '/training-academy/embryo-biopsy-training-program' },
      { label: 'Embryologist Training Program', value: '/training-academy/embryologist-training-program' },
      {
        label: 'Gynecologic Surgical Training Program',
        value: '/training-academy/gynecologic-surgical-training-program',
      },
      { label: 'Training Registration', value: '/training-academy/training-registration' },
    ],
  },
  BLOG_PAGE_TREE,
  { label: 'Thank You Page', value: '/thank-you' },
  { label: 'Privacy Policy', value: '/privacy-policy' },
  { label: 'Terms & Conditions', value: '/terms-and-conditions' },
  { label: 'Disclaimer', value: '/disclaimer' },

];

const SEO_FIELDS = [
  'pageTitle',
  'metaKeyword',
  'metaDescription',
  'newsKeywords',
  'abstract',
  'dcSource',
  'dcTitle',
  'dcKeywords',
  'dcDescription',
  'canonical',
  'alternate',
  'robot',
  'copyright',
  'author',
  'ogLocale',
  'ogType',
  'ogTitle',
  'ogDescription',
  'ogUrl',
  'ogSiteName',
  'ogImage',
  'fbAdmins',
  'twitterCard',
  'twitterSite',
  'twitterCreator',
  'twitterTitle',
  'twitterDescription',
  'twitterImageSrc',
  'twitterCanonical',
  'itemType',
  'itemName',
  'itemDescription',
  'itemUrl',
  'itemImage',
  'itemAuthor',
  'itemOrganization',
  'rawHeadTags',
];

function makeEmptySeo(pageUrl) {
  const state = { pageUrl, hierarchyPath: [] };
  SEO_FIELDS.forEach((field) => {
    state[field] = '';
  });
  return state;
}

function parsePreviewToSeoData(previewText, baseData, pageUrl) {
  const nextData = { ...baseData, pageUrl };
  const editableKeys = [
    'pageTitle',
    'metaKeyword',
    'metaDescription',
    'newsKeywords',
    'abstract',
    'robot',
    'author',
    'copyright',
    'ogLocale',
    'ogType',
    'ogTitle',
    'ogDescription',
    'ogUrl',
    'ogSiteName',
    'ogImage',
    'twitterCard',
    'twitterSite',
    'twitterCreator',
    'twitterTitle',
    'twitterDescription',
    'twitterImageSrc',
    'canonical',
    'alternate',
  ];
  editableKeys.forEach((key) => {
    nextData[key] = '';
  });

  const titleMatch = previewText.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch) nextData.pageTitle = titleMatch[1].trim();

  const fieldMap = {
    metaKeyword: 'metaKeyword',
    metaDescription: 'metaDescription',
    newsKeywords: 'newsKeywords',
    abstract: 'abstract',
    robot: 'robot',
    author: 'author',
    copyright: 'copyright',
    ogLocale: 'ogLocale',
    ogType: 'ogType',
    ogTitle: 'ogTitle',
    ogDescription: 'ogDescription',
    ogUrl: 'ogUrl',
    ogSiteName: 'ogSiteName',
    ogImage: 'ogImage',
    twitterCard: 'twitterCard',
    twitterSite: 'twitterSite',
    twitterCreator: 'twitterCreator',
    twitterTitle: 'twitterTitle',
    twitterDescription: 'twitterDescription',
    twitterImageSrc: 'twitterImageSrc',
  };

  const metaRegex = /<meta\s+([^>]*?)\/?>/gi;
  let metaMatch;
  while ((metaMatch = metaRegex.exec(previewText)) !== null) {
    const attrs = metaMatch[1];
    const nameMatch = attrs.match(/\bname\s*=\s*"([^"]+)"/i);
    const propertyMatch = attrs.match(/\bproperty\s*=\s*"([^"]+)"/i);
    const contentMatch = attrs.match(/\bcontent\s*=\s*"([^"]*)"/i);
    const tagKey = (nameMatch?.[1] || propertyMatch?.[1] || '').trim();
    if (!tagKey || !fieldMap[tagKey]) continue;
    nextData[fieldMap[tagKey]] = (contentMatch?.[1] || '').trim();
  }

  const canonicalMatch = previewText.match(
    /<link\s+[^>]*rel\s*=\s*"canonical"[^>]*href\s*=\s*"([^"]*)"[^>]*\/?>/i
  );
  if (canonicalMatch) nextData.canonical = canonicalMatch[1].trim();

  const alternateMatch = previewText.match(
    /<link\s+[^>]*rel\s*=\s*"alternate"[^>]*href\s*=\s*"([^"]*)"[^>]*\/?>/i
  );
  if (alternateMatch) nextData.alternate = alternateMatch[1].trim();

  const rawBlockMatch = previewText.match(
    /<!--\s*Raw head tags start\s*-->([\s\S]*?)<!--\s*Raw head tags end\s*-->/i
  );
  nextData.rawHeadTags = rawBlockMatch ? rawBlockMatch[1].trim() : (baseData.rawHeadTags || '');

  return nextData;
}

function getTopLevelLabel(node, parentTrail) {
  if (!parentTrail.length) return node.label;
  return parentTrail[0];
}

function getSectionAccentClass(topLevelLabel) {
  const accentMap = {
    Home: 'from-emerald-400/20 to-transparent text-emerald-700',
    'Infertility Treatment': 'from-rose-400/20 to-transparent text-rose-700',
    'IVF Centres': 'from-indigo-400/20 to-transparent text-indigo-700',
    'International Patients': 'from-cyan-400/20 to-transparent text-cyan-700',
    Resources: 'from-amber-400/25 to-transparent text-amber-700',
    'About Us': 'from-violet-400/20 to-transparent text-violet-700',
    Doctors: 'from-sky-400/20 to-transparent text-sky-700',
    'Contact Us': 'from-orange-400/20 to-transparent text-orange-700',
    'Training Academy': 'from-teal-400/20 to-transparent text-teal-700',
    Blogs: 'from-pink-400/20 to-transparent text-pink-700',
  };
  return accentMap[topLevelLabel] || 'from-zinc-300/30 to-transparent text-zinc-700';
}

/** Walk PAGE_TREE following a sequence of labels and return the matching node, or null. */
function findNodeByLabelPath(tree, labelPath) {
  if (!Array.isArray(labelPath) || labelPath.length === 0) return null;
  let nodes = Array.isArray(tree) ? tree : [];
  let foundNode = null;
  for (const label of labelPath) {
    foundNode = nodes.find((candidate) => candidate?.label === label) || null;
    if (!foundNode) return null;
    nodes = Array.isArray(foundNode.children) ? foundNode.children : [];
  }
  return foundNode;
}

/** Counts every page URL (leaf with `value`) under this node, including nested groups. */
function countLeafPagesInTree(node) {
  if (!node) return 0;
  if (node.value) return 1;
  if (!Array.isArray(node.children) || node.children.length === 0) return 0;
  return node.children.reduce((total, child) => total + countLeafPagesInTree(child), 0);
}

function SidebarNode({
  node,
  selectedPage,
  selectedSectionKey,
  expandedNodes,
  onToggle,
  onSelect,
  onSelectSection,
  level = 0,
  parentTrail = [],
}) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const nodeKey = node.value || node.label;
  const sectionKey = [...parentTrail, node.label].join(' > ');
  const isExpanded = expandedNodes[nodeKey];
  const isSelected = node.value && selectedPage === node.value;
  const isSectionSelected = !node.value && selectedSectionKey === sectionKey;
  const descendantPageCount = !node.value ? countLeafPagesInTree(node) : 0;
  const topLevelLabel = getTopLevelLabel(node, parentTrail);
  const accentClass = getSectionAccentClass(topLevelLabel);
  const disableExpand = level === 0;
  const showChevron = hasChildren && !disableExpand;
  const showChildren = hasChildren && isExpanded && !disableExpand;

  return (
    <li>
      <div
        className={`group flex items-center gap-2 rounded-xl transition ${level === 0 ? 'bg-white/70 px-2 py-1.5 ring-1 ring-zinc-100' : 'px-1 py-0.5'
          }`}
        style={{ marginLeft: `${Math.max(0, level - 1) * 10}px` }}
      >
        {showChevron ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggle(nodeKey);
            }}
            className="grid h-5 w-5 place-items-center rounded-md border border-zinc-200 bg-white text-[11px] text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
            title={isExpanded ? 'Collapse' : 'Expand'}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <span className={`inline-block transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              ›
            </span>
          </button>
        ) : (
          <span className="w-4 text-center text-[10px] text-zinc-300">•</span>
        )}

        {node.value ? (
          <button
            type="button"
            onClick={() => onSelect(node.value)}
            className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm ${isSelected
              ? 'bg-gradient-to-r from-[#cc2727]/15 to-[#cc2727]/5 font-semibold text-[#cc2727] ring-1 ring-[#cc2727]/20'
              : 'text-zinc-700 transition hover:bg-zinc-100/80'
              }`}
            title={node.value}
          >
            <span className="line-clamp-1">{node.label}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onSelectSection(node, parentTrail);
              if (!disableExpand && !isExpanded) onToggle(nodeKey);
            }}
            className={`flex w-full cursor-pointer items-center justify-between rounded-lg bg-gradient-to-r px-2.5 py-1.5 text-left transition ${accentClass} ${isSectionSelected ? 'ring-2 ring-[#cc2727]/40 shadow-sm' : 'hover:brightness-95'
              }`}
            title="Click to view all pages in this section"
          >
            <span className="text-sm font-semibold">{node.label}</span>
            {descendantPageCount > 0 ? (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-500 ring-1 ring-zinc-200">
                {descendantPageCount}
              </span>
            ) : null}
          </button>
        )}
      </div>

      {showChildren ? (
        <ul className="ml-2 mt-1 space-y-1 border-l border-zinc-200/80 pl-2">
          {node.children.map((child) => (
            <SidebarNode
              key={child.value || child.label}
              node={child}
              selectedPage={selectedPage}
              selectedSectionKey={selectedSectionKey}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
              onSelectSection={onSelectSection}
              level={level + 1}
              parentTrail={[...parentTrail, node.label]}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function flattenPageTree(nodes, trail = []) {
  return nodes.flatMap((node) => {
    const nextTrail = [...trail, node.label];
    const current = node.value
      ? [
        {
          label: node.label,
          value: node.value,
          pathTrail: nextTrail.join(' > '),
          hierarchyPath: nextTrail.length > 1 ? nextTrail.slice(0, -1) : nextTrail,
          searchText: `${node.label} ${node.value} ${nextTrail.join(' ')}`.toLowerCase(),
        },
      ]
      : [];
    const children = Array.isArray(node.children) ? flattenPageTree(node.children, nextTrail) : [];
    return [...current, ...children];
  });
}

function getUserInitials(name = '') {
  const cleanedName = String(name || '').trim();
  if (!cleanedName) return 'U';

  const words = cleanedName.split(/\s+/).filter(Boolean);
  return words
    .slice(0, 3)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

const DASHBOARD_PAGE = '__dashboard__';
const SELECTED_PAGE_STORAGE_KEY = 'seoPanelSelectedPage';
const AUTH_BACKGROUND_STYLE = {
  backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.58), rgba(15, 23, 42, 0.58)), url('/banner.webp')",
};

const HR_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'openings', label: 'Current Openings', icon: '＋' },
  { id: 'applications', label: 'Applications', icon: '▤' },
];

function HrPanel({ currentUser, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPanelUsersOpen, setIsPanelUsersOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [openingCounts, setOpeningCounts] = useState({ total: 0, published: 0 });
  const [applicationCounts, setApplicationCounts] = useState({ total: 0, new: 0 });
  const profileMenuRef = useRef(null);
  const activeItem = HR_NAV_ITEMS.find((item) => item.id === activePage) || HR_NAV_ITEMS[0];
  const initials = getUserInitials(currentUser?.name);

  useEffect(() => {
    function closeProfileMenu(event) {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
        return;
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', closeProfileMenu);
      document.addEventListener('keydown', closeProfileMenu);
    }

    return () => {
      document.removeEventListener('mousedown', closeProfileMenu);
      document.removeEventListener('keydown', closeProfileMenu);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!isMobileSidebarOpen) return undefined;
    function closeMobileSidebar(event) {
      if (event.key === 'Escape') setIsMobileSidebarOpen(false);
    }
    document.addEventListener('keydown', closeMobileSidebar);
    return () => document.removeEventListener('keydown', closeMobileSidebar);
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    let cancelled = false;
    fetchManagedJobs()
      .then((rows) => {
        if (cancelled) return;
        const jobs = Array.isArray(rows) ? rows : [];
        setOpeningCounts({
          total: jobs.length,
          published: jobs.filter((job) => job.status === 'published').length,
        });
      })
      .catch(() => {
        // The Current Openings page shows the actionable error state.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchManagedApplications()
      .then((rows) => {
        if (cancelled) return;
        const applications = Array.isArray(rows) ? rows : [];
        setApplicationCounts({
          total: applications.length,
          new: applications.filter((item) => item.status === 'new').length,
        });
      })
      .catch(() => {
        // The Applications page shows the actionable error state.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-br from-[#f8fbff] via-white to-[#fff7f9]">
      <div className="flex min-h-full">
        {isMobileSidebarOpen ? (
          <button type="button" onClick={() => setIsMobileSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] lg:hidden" aria-label="Close HR navigation" />
        ) : null}
        <aside className={`fixed inset-y-0 left-0 z-50 flex h-full w-[min(88vw,340px)] shrink-0 flex-col border-r border-zinc-200 bg-gradient-to-b from-white via-white to-zinc-50/70 p-4 shadow-xl transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:w-72 lg:translate-x-0 lg:shadow-sm ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="rounded-2xl border border-zinc-200 p-3">
            <div className="flex items-start justify-between gap-3">
              <Image src="/Header Logo.svg" alt="Seeds of Innocence" width={220} height={68} priority className="h-auto w-auto max-w-[190px]" />
              <button type="button" onClick={() => setIsMobileSidebarOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 lg:hidden" aria-label="Close HR navigation">✕</button>
            </div>
            <div className="mt-3 inline-flex rounded-full bg-[#cc2727]/10 px-3 py-1 text-xs font-bold text-[#cc2727]">
              HR Panel
            </div>
          </div>

          <nav className="mt-5 space-y-2" aria-label="HR navigation">
            {HR_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActivePage(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                  activePage === item.id
                    ? 'bg-gradient-to-r from-[#cc2727]/15 to-[#cc2727]/5 text-[#cc2727] ring-1 ring-[#cc2727]/20'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white shadow-sm" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1 p-3 sm:p-6 lg:p-8">
          <header className="flex items-start justify-between gap-3 border-b border-zinc-200 pb-4 sm:gap-4 sm:pb-5">
            <div className="flex min-w-0 items-start gap-3">
              <button type="button" onClick={() => setIsMobileSidebarOpen(true)} className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-300 bg-white text-lg text-zinc-700 shadow-sm lg:hidden" aria-label="Open HR navigation">☰</button>
              <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2EA6F7]">Seeds of Innocence</p>
              <h1 className="mt-1 text-xl font-bold text-zinc-900 sm:text-3xl">SOI Human Resource Panel</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-600 sm:text-sm">
                HR workspace · {activeItem.label}
                {currentUser?.role === 'admin' ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                    Full Admin
                  </span>
                ) : null}
              </p>
              </div>
            </div>
            <div ref={profileMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className={`relative grid h-12 w-12 place-items-center rounded-full border bg-gradient-to-br text-sm font-extrabold text-white shadow-md transition ${
                  isProfileMenuOpen
                    ? 'border-[#cc2727]/40 from-[#cc2727] to-[#e45a5a] ring-4 ring-[#cc2727]/20'
                    : 'border-zinc-200 from-[#2EA6F7] to-[#1c7fbe] hover:shadow-lg'
                }`}
                aria-label="Open HR profile menu"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
              >
                {initials}
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
              </button>

              {isProfileMenuOpen ? (
                <div className="absolute right-0 top-14 z-30 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl" role="menu">
                  <div className="bg-gradient-to-r from-[#f8fbff] via-white to-[#fff3f6] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Signed in as</p>
                    <p className="mt-1 text-sm font-bold text-zinc-900">{currentUser?.name || 'HR User'}</p>
                    <p className="mt-1 break-all text-xs text-zinc-600">{currentUser?.email || 'No email'}</p>
                    {currentUser?.role === 'admin' ? (
                      <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                        Full Admin · HR Workspace
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsPanelUsersOpen(true);
                    }}
                    className="mx-3 mt-3 w-[calc(100%-24px)] rounded-xl border border-[#2EA6F7]/30 bg-blue-50 px-3 py-2 text-sm font-semibold text-[#1679b9] transition hover:bg-blue-100"
                    role="menuitem"
                  >
                    Panel Users
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="m-3 mt-2 w-[calc(100%-24px)] rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </header>

          {activePage === 'dashboard' ? (
            <div className="mt-7">
              <div className="rounded-3xl bg-gradient-to-r from-[#173a63] to-[#2EA6F7] p-5 text-white shadow-lg sm:p-7">
                <p className="text-sm font-semibold text-white/80">Welcome back</p>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{currentUser?.name || 'HR Team'}</h2>
                <p className="mt-2 max-w-2xl text-sm text-white/85">
                  This is your private HR workspace.
                </p>
              </div>
              <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
                {[
                  ['Open Positions', String(openingCounts.published), `${openingCounts.total} total records`],
                  ['Applications', String(applicationCounts.total), `${applicationCounts.new} new applications`],
                ].map(([label, value, hint]) => (
                  <div key={label} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-zinc-600">{label}</p>
                    <p className="mt-3 text-3xl font-bold text-zinc-900">{value}</p>
                    <p className="mt-2 text-xs text-zinc-500">{hint}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : activePage === 'openings' ? (
            <HrOpenings onCountChange={setOpeningCounts} />
          ) : activePage === 'applications' ? (
            <HrApplications onCountChange={setApplicationCounts} />
          ) : null}
        </section>
      </div>
      {isPanelUsersOpen ? <PanelUsers panelRole="hr" currentUser={currentUser} onClose={() => setIsPanelUsersOpen(false)} /> : null}
    </main>
  );
}

function getInitialSelectedPage() {
  if (typeof window === 'undefined') return DASHBOARD_PAGE;
  const savedPage = window.localStorage.getItem(SELECTED_PAGE_STORAGE_KEY);
  return savedPage || DASHBOARD_PAGE;
}

export default function HomePage() {
  const isHydrated = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAuthToken()));
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [authMode, setAuthMode] = useState('login');
  const [authStep, setAuthStep] = useState('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authInfo, setAuthInfo] = useState('');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', confirmPassword: '', otp: '', role: 'seo' });
  const [otpTimer, setOtpTimer] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPanelUsersOpen, setIsPanelUsersOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const userMenuRef = useRef(null);
  const [selectedPage, setSelectedPage] = useState(getInitialSelectedPage);
  const [selectedSection, setSelectedSection] = useState(null);
  const [previousSection, setPreviousSection] = useState(null);
  const [sectionViewMode, setSectionViewMode] = useState('list');
  const [formData, setFormData] = useState(makeEmptySeo('/'));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDraft, setPreviewDraft] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    totalCount: 0,
    updatedCount: 0,
    notUpdatedCount: 0,
    updatedPageUrls: [],
    notUpdatedPageUrls: [],
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [activeDashboardList, setActiveDashboardList] = useState('all');
  const [expandedNodes, setExpandedNodes] = useState({
    'Infertility Treatment': true,
    'IVF Centres': true,
    India: true,
    'International Patients': true,
    Resources: true,
    'About Us': true,
    Doctors: true,
    'Contact Us': true,
    'Training Academy': true,
    Blogs: true,
    Fertility: true,
    Delhi: true,
    'Uttar Pradesh': true,
  });
  const currentRole =
    currentUser?.role === 'admin'
      ? currentUser?.activeRole === 'hr'
        ? 'hr'
        : 'seo'
      : currentUser?.role === 'hr'
        ? 'hr'
        : 'seo';

  const targetPageUrl = useMemo(() => selectedPage, [selectedPage]);
  const isSectionView = Boolean(selectedSection);
  const isDashboardView = selectedPage === DASHBOARD_PAGE && !isSectionView;
  const allPageOptions = useMemo(() => flattenPageTree(PAGE_TREE), []);
  const pageMetaByValue = useMemo(
    () => new Map(allPageOptions.map((item) => [item.value, item])),
    [allPageOptions]
  );
  const selectedPageMeta = useMemo(
    () => pageMetaByValue.get(selectedPage),
    [pageMetaByValue, selectedPage]
  );
  const selectedHierarchyPath = useMemo(
    () => selectedPageMeta?.hierarchyPath || [],
    [selectedPageMeta]
  );
  const selectedHierarchyKey = useMemo(
    () => JSON.stringify(selectedHierarchyPath),
    [selectedHierarchyPath]
  );
  const filteredSearchResults = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return [];
    return allPageOptions.filter((item) => item.searchText.includes(query)).slice(0, 8);
  }, [allPageOptions, searchText]);
  const userInitials = useMemo(() => getUserInitials(currentUser?.name), [currentUser?.name]);
  const pageOptionByNormalizedUrl = useMemo(
    () => new Map(allPageOptions.map((item) => [normalizePageUrl(item.value), item])),
    [allPageOptions]
  );
  const updatedPageOptions = useMemo(
    () =>
      (dashboardStats.updatedPageUrls || [])
        .map((url) => pageOptionByNormalizedUrl.get(normalizePageUrl(url)))
        .filter(Boolean),
    [dashboardStats.updatedPageUrls, pageOptionByNormalizedUrl]
  );
  const notUpdatedPageOptions = useMemo(
    () =>
      (dashboardStats.notUpdatedPageUrls || [])
        .map((url) => pageOptionByNormalizedUrl.get(normalizePageUrl(url)))
        .filter(Boolean),
    [dashboardStats.notUpdatedPageUrls, pageOptionByNormalizedUrl]
  );
  const selectedSectionKey = useMemo(() => {
    if (!selectedSection) return '';
    return [...(selectedSection.parentTrail || []), selectedSection.node.label].join(' > ');
  }, [selectedSection]);
  const sectionPages = useMemo(() => {
    if (!selectedSection) return [];
    return flattenPageTree([selectedSection.node], selectedSection.parentTrail || []);
  }, [selectedSection]);
  const updatedPageUrlSet = useMemo(
    () => new Set((dashboardStats.updatedPageUrls || []).map((u) => normalizePageUrl(u))),
    [dashboardStats.updatedPageUrls]
  );

  function handleToggleNode(nodeKey) {
    setExpandedNodes((prev) => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  }

  function deriveParentSection(value) {
    const pageMeta = pageMetaByValue.get(value);
    const hierarchyPath = pageMeta?.hierarchyPath || [];
    if (!hierarchyPath.length) return null;
    const parentNode = findNodeByLabelPath(PAGE_TREE, hierarchyPath);
    if (!parentNode) return null;
    return { node: parentNode, parentTrail: hierarchyPath.slice(0, -1) };
  }

  function handleSelectPage(value) {
    setPreviousSection(selectedSection || deriveParentSection(value));
    setSelectedPage(value);
    setSelectedSection(null);
    setIsMobileSidebarOpen(false);
  }

  function handleSelectSection(node, parentTrail) {
    setSelectedSection({ node, parentTrail: parentTrail || [] });
    setPreviousSection(null);
    setSuccessMessage('');
    setErrorMessage('');
    setIsMobileSidebarOpen(false);
  }

  function handleOpenDashboard() {
    setSelectedPage(DASHBOARD_PAGE);
    setSelectedSection(null);
    setPreviousSection(null);
    setActiveDashboardList('all');
    setIsMobileSidebarOpen(false);
  }

  function handleSelectFromSearch(item) {
    setPreviousSection(selectedSection || deriveParentSection(item.value));
    setSelectedPage(item.value);
    setSelectedSection(null);
    setSearchText(item.value);
    setShowSearchResults(false);
    setIsMobileSidebarOpen(false);
  }

  useEffect(() => {
    if (!isMobileSidebarOpen) return undefined;
    function closeMobileSidebar(event) {
      if (event.key === 'Escape') setIsMobileSidebarOpen(false);
    }
    document.addEventListener('keydown', closeMobileSidebar);
    return () => document.removeEventListener('keydown', closeMobileSidebar);
  }, [isMobileSidebarOpen]);

  function handleGoBackFromForm() {
    if (previousSection) {
      setSelectedSection(previousSection);
      setPreviousSection(null);
      setSuccessMessage('');
      setErrorMessage('');
      return;
    }
    handleOpenDashboard();
  }

  function startSidebarResize() {
    setIsResizingSidebar(true);
  }

  useEffect(() => {
    if (!isAuthenticated || currentRole !== 'seo' || isDashboardView || isSectionView) {
      return undefined;
    }

    const hierarchyPath = JSON.parse(selectedHierarchyKey);
    let isCancelled = false;

    async function loadSeo() {
      setLoading(true);
      setSuccessMessage('');
      setErrorMessage('');

      try {
        const seoData = await fetchSeo(targetPageUrl, hierarchyPath);
        if (isCancelled) return;
        const baseData = {
          ...makeEmptySeo(targetPageUrl),
          ...seoData,
          pageUrl: targetPageUrl,
          hierarchyPath,
        };
        setFormData({
          ...baseData,
          pageUrl: targetPageUrl,
          hierarchyPath,
        });
      } catch (error) {
        if (isCancelled) return;
        if (/unauthorized/i.test(error.message || '')) {
          clearAuthSession();
          setIsAuthenticated(false);
          setCurrentUser(null);
          setErrorMessage('Session expired. Please login again.');
          return;
        }
        const fallbackData = {
          ...makeEmptySeo(targetPageUrl),
          hierarchyPath,
        };
        setFormData({
          ...fallbackData,
          pageUrl: targetPageUrl,
          hierarchyPath,
        });
        setErrorMessage(error.message || 'Unable to fetch SEO data');
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadSeo();
    return () => {
      isCancelled = true;
    };
  }, [targetPageUrl, selectedHierarchyKey, isAuthenticated, currentRole, isDashboardView, isSectionView]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timeoutId = window.setTimeout(() => setSuccessMessage(''), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    if (!isAuthenticated || currentRole !== 'seo' || !allPageOptions.length) {
      return undefined;
    }

    let isCancelled = false;
    async function loadStats() {
      setStatsLoading(true);
      try {
        const stats = await fetchSeoStats(allPageOptions.map((item) => item.value));
        if (isCancelled) return;
        setDashboardStats({
          totalCount: stats?.totalCount || allPageOptions.length,
          updatedCount: stats?.updatedCount || 0,
          notUpdatedCount: stats?.notUpdatedCount ?? Math.max(0, allPageOptions.length - (stats?.updatedCount || 0)),
          updatedPageUrls: Array.isArray(stats?.updatedPageUrls) ? stats.updatedPageUrls : [],
          notUpdatedPageUrls: Array.isArray(stats?.notUpdatedPageUrls) ? stats.notUpdatedPageUrls : [],
        });
      } catch {
        if (isCancelled) return;
        setDashboardStats({
          totalCount: allPageOptions.length,
          updatedCount: 0,
          notUpdatedCount: allPageOptions.length,
          updatedPageUrls: [],
          notUpdatedPageUrls: allPageOptions.map((item) => item.value),
        });
      } finally {
        if (!isCancelled) {
          setStatsLoading(false);
        }
      }
    }

    loadStats();
    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, currentRole, allPageOptions]);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(SELECTED_PAGE_STORAGE_KEY, selectedPage);
  }, [isHydrated, selectedPage]);

  useEffect(() => {
    function handleMouseMove(event) {
      if (!isResizingSidebar) return;
      const minWidth = 260;
      const maxWidth = 520;
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, event.clientX));
      setSidebarWidth(nextWidth);
    }

    function handleMouseUp() {
      setIsResizingSidebar(false);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  const previewMarkup = useMemo(() => {
    const tags = [];
    const value = (key) => (formData[key] || '').trim();
    const pushMeta = (attr, key) => {
      if (value(key)) tags.push(`<meta ${attr}="${key}" content="${value(key)}" />`);
    };

    if (value('pageTitle')) tags.push(`<title>${value('pageTitle')}</title>`);
    pushMeta('name', 'metaKeyword');
    pushMeta('name', 'metaDescription');
    pushMeta('name', 'newsKeywords');
    pushMeta('name', 'abstract');
    pushMeta('name', 'robot');
    pushMeta('name', 'author');
    pushMeta('name', 'copyright');
    pushMeta('property', 'ogLocale');
    pushMeta('property', 'ogType');
    pushMeta('property', 'ogTitle');
    pushMeta('property', 'ogDescription');
    pushMeta('property', 'ogUrl');
    pushMeta('property', 'ogSiteName');
    pushMeta('property', 'ogImage');
    pushMeta('name', 'twitterCard');
    pushMeta('name', 'twitterSite');
    pushMeta('name', 'twitterCreator');
    pushMeta('name', 'twitterTitle');
    pushMeta('name', 'twitterDescription');
    pushMeta('name', 'twitterImageSrc');

    if (value('canonical')) tags.push(`<link rel="canonical" href="${value('canonical')}" />`);
    if (value('alternate')) tags.push(`<link rel="alternate" href="${value('alternate')}" />`);
    if (value('rawHeadTags')) {
      tags.push('<!-- Raw head tags start -->');
      tags.push(value('rawHeadTags'));
      tags.push('<!-- Raw head tags end -->');
    }

    return tags.length
      ? [`<!-- HEAD preview for ${targetPageUrl} -->`, ...tags].join('\n')
      : '<!-- No SEO tags filled yet -->';
  }, [formData, targetPageUrl]);

  function openPreview() {
    setSuccessMessage('');
    setErrorMessage('');
    setPreviewDraft(previewMarkup);
    setIsPreviewOpen(true);
  }

  async function handleSave(payload = formData) {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const savedData = await saveSeo({
        ...payload,
        pageUrl: targetPageUrl,
        hierarchyPath: selectedHierarchyPath,
      });
      setFormData({
        ...makeEmptySeo(targetPageUrl),
        ...savedData,
        pageUrl: targetPageUrl,
        hierarchyPath: selectedHierarchyPath,
      });
      setSuccessMessage('SEO saved successfully.');
    } catch (error) {
      if (/unauthorized/i.test(error.message || '')) {
        clearAuthSession();
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
      setErrorMessage(error.message || 'Unable to save SEO data');
    } finally {
      setSaving(false);
    }
  }

  function handleAuthFieldChange(event) {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleLogout() {
    clearAuthSession();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthError('');
    setIsUserMenuOpen(false);
  }

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleDocumentClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (authStep !== 'otp' || otpTimer <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [authStep, otpTimer]);

  async function handleResendOtp() {
    setAuthLoading(true);
    setAuthError('');
    setAuthInfo('');
    try {
      const payload = {
        email: authForm.email.trim(),
        password: authForm.password,
        role: authForm.role,
      };

      const response = authMode === 'forgot'
        ? await requestPasswordResetOtp({ email: authForm.email.trim() })
        : authMode === 'signup'
          ? await requestSignupOtp({ ...payload, name: authForm.name.trim() })
          : await requestLoginOtp(payload);

      setOtpTimer(Number(response?.expiresInSeconds) || 60);
      setAuthInfo('OTP resent successfully. Please check your email.');
    } catch (error) {
      setAuthError(error.message || 'Failed to resend OTP');
    } finally {
      setAuthLoading(false);
    }
  }

  function completeAuthentication(authResponse) {
    saveAuthSession(authResponse);
    setCurrentUser(authResponse.user || null);
    setIsAuthenticated(true);
    setSelectedPage(DASHBOARD_PAGE);
    setSelectedSection(null);
    setActiveDashboardList('all');
    setAuthForm({ name: '', email: '', password: '', confirmPassword: '', otp: '', role: 'seo' });
    setOtpTimer(0);
    setAuthStep('credentials');
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthInfo('');

    try {
      if (authMode === 'forgot') {
        if (authStep === 'credentials') {
          const response = await requestPasswordResetOtp({ email: authForm.email.trim() });
          setOtpTimer(Number(response?.expiresInSeconds) || 60);
          setAuthStep('otp');
          setAuthInfo('Password reset OTP sent to your email. OTP is valid for 1 minute.');
        } else {
          if (authForm.password !== authForm.confirmPassword) {
            throw new Error('New password and confirm password do not match');
          }
          await resetPasswordWithOtp({
            email: authForm.email.trim(),
            otp: authForm.otp.trim(),
            password: authForm.password,
          });
          setAuthMode('login');
          setAuthStep('credentials');
          setOtpTimer(0);
          setShowPassword(false);
          setAuthForm((prev) => ({ ...prev, password: '', confirmPassword: '', otp: '' }));
          setAuthInfo('Password reset successfully. Please login with your new password.');
        }
        return;
      }

      if (authStep === 'credentials') {
        const payload = {
          email: authForm.email.trim(),
          password: authForm.password,
          role: authForm.role,
        };

        if (authMode === 'signup') {
          const response = await requestSignupOtp({ ...payload, name: authForm.name.trim() });
          if (response?.token) {
            completeAuthentication(response);
            return;
          }
          setOtpTimer(Number(response?.expiresInSeconds) || 60);
        } else {
          const response = await requestLoginOtp(payload);
          if (response?.token) {
            completeAuthentication(response);
            return;
          }
          setOtpTimer(Number(response?.expiresInSeconds) || 60);
        }

        setAuthStep('otp');
        setAuthInfo('OTP sent to your email. OTP is valid for 1 minute.');
      } else {
        const verifyPayload = {
          email: authForm.email.trim(),
          otp: authForm.otp.trim(),
        };

        const authResponse =
          authMode === 'signup' ? await verifySignupOtp(verifyPayload) : await verifyLoginOtp(verifyPayload);

        completeAuthentication(authResponse);
      }
    } catch (error) {
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  }

  if (!isHydrated) {
    return (
      <main style={AUTH_BACKGROUND_STYLE} className="grid min-h-0 flex-1 place-items-center overflow-y-auto bg-cover bg-center bg-no-repeat p-3 sm:p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
          <p className="text-sm font-semibold text-zinc-700">Loading SOI Panel...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main style={AUTH_BACKGROUND_STYLE} className="grid min-h-0 flex-1 place-items-center overflow-y-auto bg-cover bg-center bg-no-repeat p-3 sm:p-4">
        <div className="w-full max-w-xl p-2 sm:p-4">
          <Image
            src="/Header Logo.svg"
            alt="Seeds of Innocence"
            width={280}
            height={86}
            priority
            className="mx-auto h-auto w-auto max-w-[220px] drop-shadow-lg sm:max-w-[280px]"
          />
          <h1 className="mt-4 text-center text-2xl font-bold text-white drop-shadow-md sm:text-3xl">SOI Panel Access</h1>
          <p className="mt-2 text-center text-base font-medium text-white/90 drop-shadow-sm">
            {authStep === 'credentials'
              ? authMode === 'forgot'
                ? 'Enter your registered email to reset your password.'
                : `Please ${authMode === 'signup' ? 'create an account' : 'login'} to continue.`
              : authMode === 'forgot'
                ? 'Enter the OTP and create your new password.'
                : 'Enter OTP sent to your email to continue.'}
          </p>

          {authMode !== 'forgot' ? <div className="mt-5 flex justify-center">
            <div className="inline-flex rounded-xl bg-black/35 p-1.5 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthStep('credentials');
                  setShowPassword(false);
                  setOtpTimer(0);
                  setAuthError('');
                  setAuthInfo('');
                  setAuthForm((prev) => ({ ...prev, password: '', confirmPassword: '', otp: '' }));
                }}
                className={`rounded-lg px-6 py-2.5 text-base font-semibold ${authMode === 'login' ? 'bg-[#cc2727] text-white shadow-sm' : 'text-white/85'
                  }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthStep('credentials');
                  setShowPassword(false);
                  setOtpTimer(0);
                  setAuthError('');
                  setAuthInfo('');
                  setAuthForm((prev) => ({ ...prev, password: '', confirmPassword: '', otp: '' }));
                }}
                className={`rounded-lg px-6 py-2.5 text-base font-semibold ${authMode === 'signup' ? 'bg-[#cc2727] text-white shadow-sm' : 'text-white/85'
                  }`}
              >
                Signup
              </button>
            </div>
          </div> : (
            <div className="mt-5 flex justify-center">
              <span className="rounded-full bg-black/35 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">Password Recovery</span>
            </div>
          )}

          <form className="mx-auto mt-6 w-full max-w-lg space-y-4" onSubmit={handleAuthSubmit}>
            {authStep === 'credentials' && authMode !== 'forgot' ? (
              <div>
                <label htmlFor="role" className="mb-2 block text-sm font-semibold text-white drop-shadow-sm">
                  Select your role
                </label>
                <select
                  id="role"
                  name="role"
                  value={authForm.role}
                  onChange={handleAuthFieldChange}
                  className="w-full rounded-xl border-0 bg-white/95 px-4 py-3 text-base text-zinc-800 shadow-lg outline-none focus:ring-2 focus:ring-[#2EA6F7]"
                >
                  <option value="seo">SEO</option>
                  <option value="hr">HR</option>
                </select>
              </div>
            ) : authStep === 'otp' ? (
              <div className="rounded-xl bg-black/35 px-4 py-3 text-center text-sm font-semibold text-white backdrop-blur-sm">
                {authMode === 'forgot' ? 'Secure password reset verification' : `Signing in to the ${authForm.role.toUpperCase()} panel`}
              </div>
            ) : null}
            {authStep === 'credentials' && authMode === 'signup' ? (
              <input
                type="text"
                name="name"
                value={authForm.name}
                onChange={handleAuthFieldChange}
                placeholder="Full name"
                className="w-full rounded-xl border-0 bg-white/95 px-4 py-3 text-base text-zinc-800 shadow-lg outline-none focus:ring-2 focus:ring-[#2EA6F7]"
              />
            ) : null}
            <input
              type="email"
              name="email"
              value={authForm.email}
              onChange={handleAuthFieldChange}
              placeholder="Email"
              required
              disabled={authStep === 'otp'}
              className="w-full rounded-xl border-0 bg-white/95 px-4 py-3 text-base text-zinc-800 shadow-lg outline-none focus:ring-2 focus:ring-[#2EA6F7] disabled:cursor-not-allowed disabled:bg-white/80"
            />
            {authStep === 'credentials' && authMode !== 'forgot' ? (
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={authForm.password}
                    onChange={handleAuthFieldChange}
                    placeholder="Password"
                    required
                    minLength={10}
                    maxLength={128}
                    className="w-full rounded-xl border-0 bg-white/95 px-4 py-3 pr-12 text-base text-zinc-800 shadow-lg outline-none focus:ring-2 focus:ring-[#2EA6F7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 text-lg text-zinc-500 hover:text-zinc-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👀'}
                  </button>
                </div>
                {authMode === 'signup' ? <p className="mt-2 text-center text-sm font-medium text-white/90 drop-shadow-sm">Password minimum 10 characters.</p> : null}
              </div>
            ) : authStep === 'otp' ? (
              <div className="space-y-4">
                <p className="mb-2 text-center text-sm font-semibold text-white drop-shadow-sm">
                  OTP Timer: 00:{String(otpTimer).padStart(2, '0')}
                </p>
                <input
                  type="text"
                  name="otp"
                  value={authForm.otp}
                  onChange={handleAuthFieldChange}
                  placeholder="Enter 4-digit OTP"
                  maxLength={4}
                  required
                  inputMode="numeric"
                  className="w-full rounded-xl border-0 bg-white/95 px-4 py-3 text-center text-base text-zinc-800 shadow-lg outline-none focus:ring-2 focus:ring-[#2EA6F7]"
                />
                {authMode === 'forgot' ? (
                  <>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={authForm.password}
                        onChange={handleAuthFieldChange}
                        placeholder="New password"
                        required
                        minLength={10}
                        maxLength={128}
                        autoComplete="new-password"
                        className="w-full rounded-xl border-0 bg-white/95 px-4 py-3 pr-16 text-base text-zinc-800 shadow-lg outline-none focus:ring-2 focus:ring-[#2EA6F7]"
                      />
                      <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute inset-y-0 right-3 text-xs font-bold text-[#1679b9]" aria-label={showPassword ? 'Hide new passwords' : 'Show new passwords'}>{showPassword ? 'Hide' : 'Show'}</button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={authForm.confirmPassword}
                      onChange={handleAuthFieldChange}
                      placeholder="Confirm new password"
                      required
                      minLength={10}
                      maxLength={128}
                      autoComplete="new-password"
                      className="w-full rounded-xl border-0 bg-white/95 px-4 py-3 text-base text-zinc-800 shadow-lg outline-none focus:ring-2 focus:ring-[#2EA6F7]"
                    />
                    <p className="text-center text-xs font-medium text-white/90 drop-shadow-sm">New password must contain at least 10 characters.</p>
                  </>
                ) : null}
              </div>
            ) : null}
            {authMode === 'login' && authStep === 'credentials' ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('forgot');
                    setAuthStep('credentials');
                    setShowPassword(false);
                    setOtpTimer(0);
                    setAuthError('');
                    setAuthInfo('');
                    setAuthForm((prev) => ({ ...prev, password: '', confirmPassword: '', otp: '' }));
                  }}
                  className="text-sm font-bold text-white drop-shadow-sm hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            ) : null}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-xl bg-[#cc2727] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#a91f1f] disabled:opacity-60"
            >
              {authLoading
                ? 'Please wait...'
                : authMode === 'forgot'
                  ? authStep === 'credentials'
                    ? 'Send Password Reset OTP'
                    : 'Verify OTP & Reset Password'
                  : authStep === 'credentials'
                  ? authMode === 'signup'
                    ? 'Send OTP for Signup'
                    : 'Send OTP for Login'
                  : authMode === 'signup'
                    ? 'Verify OTP and Create Account'
                    : 'Verify OTP and Login'}
            </button>
            {authMode === 'forgot' && authStep === 'credentials' ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthStep('credentials');
                  setShowPassword(false);
                  setAuthError('');
                  setAuthInfo('');
                  setAuthForm((prev) => ({ ...prev, password: '', confirmPassword: '', otp: '' }));
                }}
                className="w-full rounded-xl bg-black/35 px-4 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-black/50"
              >
                Back to Login
              </button>
            ) : null}
            {authStep === 'otp' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={authLoading || otpTimer > 0}
                  className="w-full rounded-xl bg-black/35 px-4 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-black/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {otpTimer > 0 ? `Resend OTP in 00:${String(otpTimer).padStart(2, '0')}` : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthStep('credentials');
                    setOtpTimer(0);
                    setAuthError('');
                    setAuthInfo('');
                    setAuthForm((prev) => ({ ...prev, otp: '' }));
                  }}
                  className="w-full rounded-xl bg-black/35 px-4 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-black/50"
                >
                  Back
                </button>
              </div>
            ) : null}
          </form>

          {authInfo ? <p className="mt-4 rounded-xl bg-emerald-950/60 px-4 py-3 text-center text-sm font-semibold text-emerald-100 backdrop-blur-sm">{authInfo}</p> : null}
          {authError ? <p className="mt-4 rounded-xl bg-red-950/65 px-4 py-3 text-center text-sm font-semibold text-red-100 backdrop-blur-sm">{authError}</p> : null}
        </div>
      </main>
    );
  }

  if (currentRole === 'hr') {
    return <HrPanel currentUser={currentUser} onLogout={handleLogout} />;
  }

  return (
    <main className="min-h-0 flex-1 overflow-hidden bg-gradient-to-br from-[#f8fbff] via-white to-[#fff7f9]">
      <div className="flex h-full w-full">
        {isMobileSidebarOpen ? (
          <button type="button" onClick={() => setIsMobileSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] lg:hidden" aria-label="Close SEO navigation" />
        ) : null}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-full w-[min(88vw,340px)] shrink-0 flex-col border-r border-zinc-200 bg-gradient-to-b from-white via-white to-zinc-50/70 p-4 shadow-xl backdrop-blur transition-transform duration-200 lg:relative lg:z-auto lg:w-[var(--desktop-sidebar-width)] lg:translate-x-0 lg:shadow-sm ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ '--desktop-sidebar-width': `${sidebarWidth}px` }}
        >
          <div className="shrink-0 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <Image src="/Header Logo.svg" alt="Seeds of Innocence" width={220} height={68} priority className="h-auto w-auto max-w-[190px]" />
              <button type="button" onClick={() => setIsMobileSidebarOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 lg:hidden" aria-label="Close SEO navigation">✕</button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Select a page path to edit SEO details.</p>
            <div className="mt-3 inline-flex items-center rounded-full bg-[#2EA6F7]/10 px-2.5 py-1 text-[11px] font-semibold text-[#1c7fbe]">
              Total Pages: {allPageOptions.length}
            </div>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            <ul className="space-y-1.5 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
              <li>
                <button
                  type="button"
                  onClick={handleOpenDashboard}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${isDashboardView
                    ? 'bg-gradient-to-r from-[#cc2727]/15 to-[#cc2727]/5 text-[#cc2727] ring-1 ring-[#cc2727]/20'
                    : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                    }`}
                >
                  Dashboard
                </button>
              </li>
              {PAGE_TREE.map((node) => (
                <SidebarNode
                  key={node.value || node.label}
                  node={node}
                  selectedPage={selectedPage}
                  selectedSectionKey={selectedSectionKey}
                  expandedNodes={expandedNodes}
                  onToggle={handleToggleNode}
                  onSelect={handleSelectPage}
                  onSelectSection={handleSelectSection}
                  parentTrail={[]}
                />
              ))}
            </ul>
          </div>

          <button
            type="button"
            onMouseDown={startSidebarResize}
            className={`absolute right-0 top-0 hidden h-full w-2 translate-x-1/2 cursor-col-resize rounded-full transition lg:block ${isResizingSidebar ? 'bg-[#2EA6F7]/30' : 'bg-transparent hover:bg-[#2EA6F7]/20'
              }`}
            title="Drag to resize sidebar"
            aria-label="Resize sidebar"
          />
        </aside>

        <div className="h-full min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto h-full w-full max-w-[1200px] p-2 sm:p-4 lg:p-6">
            <div className="flex min-h-full flex-col rounded-2xl bg-white p-3 sm:p-5 lg:h-full lg:p-6">
              <div className="relative shrink-0 border-b border-zinc-100 pb-4">
                <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_minmax(420px,560px)_auto] lg:items-start">
                  <div className="flex min-w-0 items-start gap-3 pr-14 lg:pr-0">
                    <button type="button" onClick={() => setIsMobileSidebarOpen(true)} className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-300 bg-white text-lg text-zinc-700 shadow-sm lg:hidden" aria-label="Open SEO navigation">☰</button>
                    <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#2EA6F7]">Seeds of Innocence</p>
                    <h1 className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">SOI Admin Panel</h1>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                      {!isDashboardView && !isSectionView ? (
                        <button
                          type="button"
                          onClick={handleGoBackFromForm}
                          className="inline-grid h-7 w-7 place-items-center rounded-full border border-zinc-300 bg-white text-zinc-600 shadow-sm transition hover:border-[#cc2727]/40 hover:bg-[#cc2727]/5 hover:text-[#cc2727]"
                          title={
                            previousSection
                              ? `Back to ${previousSection.node.label}`
                              : 'Back to Dashboard'
                          }
                          aria-label={
                            previousSection
                              ? `Back to ${previousSection.node.label}`
                              : 'Back to Dashboard'
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                          </svg>
                        </button>
                      ) : null}
                      <span>
                        {isDashboardView
                          ? 'Current view:'
                          : isSectionView
                            ? 'Section:'
                            : 'Selected path:'}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-900">
                        {isDashboardView
                          ? 'Dashboard'
                          : isSectionView
                            ? [...(selectedSection.parentTrail || []), selectedSection.node.label].join(' › ')
                            : targetPageUrl}
                      </span>
                    </p>
                    </div>
                  </div>

                  <div className="relative w-full lg:justify-self-center">
                    <input
                      type="text"
                      value={searchText}
                      onChange={(event) => {
                        setSearchText(event.target.value);
                        setShowSearchResults(true);
                      }}
                      onFocus={() => setShowSearchResults(true)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && filteredSearchResults.length > 0) {
                          event.preventDefault();
                          handleSelectFromSearch(filteredSearchResults[0]);
                        }
                      }}
                      placeholder="Search by page name or path (e.g. IVF, /contact/whatsapp)"
                      disabled={isDashboardView}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20"
                    />

                    {showSearchResults && searchText.trim() && !isDashboardView ? (
                      <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
                        {filteredSearchResults.length > 0 ? (
                          filteredSearchResults.map((item) => (
                            <button
                              key={`${item.value}-${item.pathTrail}`}
                              type="button"
                              onClick={() => handleSelectFromSearch(item)}
                              className="block w-full rounded-lg px-3 py-2 text-left hover:bg-zinc-100"
                            >
                              <p className="text-sm font-medium text-zinc-800">{item.label}</p>
                              <p className="text-xs text-zinc-500">{item.value}</p>
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-sm text-zinc-500">No page found</p>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div ref={userMenuRef} className="absolute right-0 top-0 shrink-0 lg:relative lg:right-auto lg:top-auto">
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen((prev) => !prev)}
                      className={`relative grid h-12 w-12 place-items-center rounded-full border bg-gradient-to-br text-sm font-extrabold text-white shadow-md transition ${isUserMenuOpen
                        ? 'border-[#cc2727]/40 from-[#cc2727] to-[#e45a5a] ring-4 ring-[#cc2727]/20'
                        : 'border-zinc-200 from-[#2EA6F7] to-[#1c7fbe] hover:shadow-lg'
                        }`}
                      title="User menu"
                      aria-label="User menu"
                    >
                      {userInitials}
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                    </button>
                    {isUserMenuOpen ? (
                      <div className="absolute right-0 top-14 z-30 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
                        <div className="bg-gradient-to-r from-[#f8fbff] via-white to-[#fff3f6] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Signed in as</p>
                          <p className="mt-1 text-sm font-bold text-zinc-900">{currentUser?.name || 'User'}</p>
                          <p className="mt-1 text-xs text-zinc-600">{currentUser?.email || 'No email'}</p>
                          {currentUser?.role === 'admin' ? (
                            <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                              Full Admin · SEO Workspace
                            </span>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsPanelUsersOpen(true);
                          }}
                          className="mx-3 mt-3 w-[calc(100%-24px)] rounded-xl border border-[#2EA6F7]/30 bg-blue-50 px-3 py-2 text-sm font-semibold text-[#1679b9] transition hover:bg-blue-100"
                        >
                          Panel Users
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="m-3 mt-2 w-[calc(100%-24px)] rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                        >
                          Logout
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
                {isDashboardView ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => setActiveDashboardList((prev) => (prev === 'all' ? null : 'all'))}
                        className="rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:border-[#2EA6F7]/40 hover:shadow-md"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total Pages</p>
                        <p className="mt-2 text-3xl font-bold text-zinc-900">{dashboardStats.totalCount}</p>
                        <p className="mt-2 text-xs text-zinc-500">
                          {activeDashboardList === 'all' ? 'Click to hide list' : 'Click to view all pages'}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDashboardList((prev) => (prev === 'updated' ? null : 'updated'))}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-left shadow-sm transition hover:shadow-md"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">SEO Updated</p>
                        <p className="mt-2 text-3xl font-bold text-emerald-700">
                          {statsLoading ? '...' : dashboardStats.updatedCount}
                        </p>
                        <p className="mt-2 text-xs text-emerald-700/80">
                          {activeDashboardList === 'updated' ? 'Click to hide list' : 'Click to view updated pages'}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDashboardList((prev) => (prev === 'notUpdated' ? null : 'notUpdated'))}
                        className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-left shadow-sm transition hover:shadow-md"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">SEO Not Updated</p>
                        <p className="mt-2 text-3xl font-bold text-amber-700">
                          {statsLoading ? '...' : dashboardStats.notUpdatedCount}
                        </p>
                        <p className="mt-2 text-xs text-amber-700/80">
                          {activeDashboardList === 'notUpdated' ? 'Click to hide list' : 'Click to view pending pages'}
                        </p>
                      </button>
                    </div>
                    {activeDashboardList ? (
                      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                        <h3 className="text-base font-bold text-zinc-900">
                          {activeDashboardList === 'all'
                            ? 'All Pages'
                            : activeDashboardList === 'updated'
                              ? 'SEO Updated Pages'
                              : 'SEO Not Updated Pages'}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500">Page name and URL list</p>
                        <div className="mt-3 max-h-[340px] overflow-auto rounded-xl border border-zinc-100">
                          <table className="min-w-[520px] w-full border-collapse">
                            <thead className="sticky top-0 bg-zinc-50">
                              <tr>
                                <th className="border-b border-zinc-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                  Page Name
                                </th>
                                <th className="border-b border-zinc-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                  Page URL
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {(activeDashboardList === 'all'
                                ? allPageOptions
                                : activeDashboardList === 'updated'
                                  ? updatedPageOptions
                                  : notUpdatedPageOptions
                              ).map((item) => (
                                <tr key={`${item.value}-${item.pathTrail}`} className="odd:bg-white even:bg-zinc-50/40">
                                  <td className="border-b border-zinc-100 px-3 py-2 text-sm text-zinc-800">
                                    <button
                                      type="button"
                                      onClick={() => handleSelectPage(item.value)}
                                      className="text-left font-medium text-[#1c7fbe] hover:underline"
                                    >
                                      {item.label}
                                    </button>
                                  </td>
                                  <td className="border-b border-zinc-100 px-3 py-2 text-xs text-zinc-600">
                                    <button
                                      type="button"
                                      onClick={() => handleSelectPage(item.value)}
                                      className="text-left text-zinc-700 hover:text-[#1c7fbe] hover:underline"
                                    >
                                      {item.value}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : isSectionView ? (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-zinc-200 bg-gradient-to-r from-white via-white to-[#fff3f6] p-4 shadow-sm">
                      <div className="min-w-0">
                        {(selectedSection.parentTrail || []).length > 0 ? (
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                            {(selectedSection.parentTrail || []).join(' › ')}
                          </p>
                        ) : null}
                        <h2 className="mt-1 text-2xl font-bold text-zinc-900">{selectedSection.node.label}</h2>
                        <p className="mt-1 text-sm text-zinc-600">
                          {sectionPages.length} {sectionPages.length === 1 ? 'page' : 'pages'} available. Click the
                          edit icon on any row to manage its SEO.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div
                          className="inline-flex items-center rounded-xl border border-zinc-200 bg-white p-1 shadow-sm"
                          role="tablist"
                          aria-label="Toggle view"
                        >
                          <button
                            type="button"
                            onClick={() => setSectionViewMode('list')}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${sectionViewMode === 'list'
                              ? 'bg-[#cc2727] text-white shadow-sm'
                              : 'text-zinc-600 hover:bg-zinc-100'
                              }`}
                            title="List view"
                            aria-pressed={sectionViewMode === 'list'}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <line x1="8" y1="6" x2="21" y2="6" />
                              <line x1="8" y1="12" x2="21" y2="12" />
                              <line x1="8" y1="18" x2="21" y2="18" />
                              <line x1="3" y1="6" x2="3.01" y2="6" />
                              <line x1="3" y1="12" x2="3.01" y2="12" />
                              <line x1="3" y1="18" x2="3.01" y2="18" />
                            </svg>
                            List
                          </button>
                          <button
                            type="button"
                            onClick={() => setSectionViewMode('grid')}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${sectionViewMode === 'grid'
                              ? 'bg-[#cc2727] text-white shadow-sm'
                              : 'text-zinc-600 hover:bg-zinc-100'
                              }`}
                            title="Grid view"
                            aria-pressed={sectionViewMode === 'grid'}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <rect x="3" y="3" width="7" height="7" />
                              <rect x="14" y="3" width="7" height="7" />
                              <rect x="14" y="14" width="7" height="7" />
                              <rect x="3" y="14" width="7" height="7" />
                            </svg>
                            Grid
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenDashboard}
                          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                        >
                          ← Back to Dashboard
                        </button>
                      </div>
                    </div>

                    {sectionPages.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
                        <p className="text-sm text-zinc-500">No pages found in this section.</p>
                      </div>
                    ) : sectionViewMode === 'list' ? (
                      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                        <div className="max-h-[60vh] overflow-auto">
                          <table className="min-w-[680px] w-full border-collapse">
                            <thead className="sticky top-0 z-10 bg-zinc-50">
                              <tr>
                                <th className="w-14 border-b border-zinc-200 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                  S.No
                                </th>
                                <th className="border-b border-zinc-200 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                  Page Name
                                </th>
                                <th className="border-b border-zinc-200 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                  Page URL
                                </th>
                                <th className="w-32 border-b border-zinc-200 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                  Status
                                </th>
                                <th className="w-20 border-b border-zinc-200 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {sectionPages.map((item, index) => {
                                const isUpdated = updatedPageUrlSet.has(normalizePageUrl(item.value));
                                return (
                                  <tr
                                    key={`${item.value}-${item.pathTrail}`}
                                    className="border-b border-zinc-100 transition odd:bg-white even:bg-zinc-50/40 hover:bg-[#fff3f6]/60"
                                  >
                                    <td className="px-3 py-2.5 text-sm font-semibold text-zinc-500">
                                      {index + 1}
                                    </td>
                                    <td className="px-3 py-2.5 text-sm font-semibold text-zinc-900">
                                      <span className="line-clamp-1" title={item.label}>
                                        {item.label}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-xs text-zinc-600">
                                      <span className="line-clamp-1 break-all" title={item.value}>
                                        {item.value}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isUpdated
                                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                          }`}
                                      >
                                        <span
                                          className={`inline-block h-1.5 w-1.5 rounded-full ${isUpdated ? 'bg-emerald-500' : 'bg-amber-500'
                                            }`}
                                          aria-hidden="true"
                                        />
                                        {isUpdated ? 'Updated' : 'Pending'}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleSelectPage(item.value)}
                                        className="inline-grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-[#cc2727]/30 hover:bg-[#cc2727]/5 hover:text-[#cc2727]"
                                        title={`Edit SEO for ${item.label}`}
                                        aria-label={`Edit SEO for ${item.label}`}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="14"
                                          height="14"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {sectionPages.map((item, index) => {
                          const isUpdated = updatedPageUrlSet.has(normalizePageUrl(item.value));
                          return (
                            <div
                              key={`${item.value}-${item.pathTrail}`}
                              className="group flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2EA6F7]/40 hover:shadow-md"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600">
                                    {index + 1}
                                  </span>
                                  <span
                                    className={`inline-flex h-2 w-2 shrink-0 rounded-full ${isUpdated ? 'bg-emerald-500' : 'bg-amber-500'
                                      }`}
                                    aria-hidden="true"
                                  />
                                  <p
                                    className="line-clamp-1 text-sm font-semibold text-zinc-900"
                                    title={item.label}
                                  >
                                    {item.label}
                                  </p>
                                </div>
                                <p
                                  className="mt-1 line-clamp-1 break-all text-xs text-zinc-500"
                                  title={item.value}
                                >
                                  {item.value}
                                </p>
                                <span
                                  className={`mt-3 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isUpdated
                                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                    }`}
                                >
                                  {isUpdated ? 'SEO Updated' : 'SEO Pending'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSelectPage(item.value)}
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:border-[#cc2727]/30 hover:bg-[#cc2727]/5 hover:text-[#cc2727]"
                                title={`Edit SEO for ${item.label}`}
                                aria-label={`Edit SEO for ${item.label}`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : loading ? (
                  <p className="text-sm text-zinc-600">Loading SEO data...</p>
                ) : (
                  <form className="space-y-6">
                    <SeoForm
                      formData={formData}
                      onChange={handleFieldChange}
                    />

                    <div className="flex flex-wrap items-center gap-3 pb-2">
                      <button
                        type="button"
                        onClick={handleGoBackFromForm}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="19" y1="12" x2="5" y2="12" />
                          <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={openPreview}
                        className="rounded-xl bg-[#cc2727] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a91f1f] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Preview & Save SEO
                      </button>
                    </div>
                  </form>
                )}

                {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {successMessage ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-3 backdrop-blur-md animate-in fade-in sm:p-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-white px-5 py-7 text-center shadow-2xl ring-1 ring-emerald-200 sm:px-10 sm:py-8">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 ring-4 ring-emerald-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-600"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-lg font-bold text-zinc-900">{successMessage}</p>
            <p className="text-xs text-zinc-500">Your changes have been saved.</p>
          </div>
        </div>
      ) : null}

      {isPanelUsersOpen ? <PanelUsers panelRole="seo" currentUser={currentUser} onClose={() => setIsPanelUsersOpen(false)} /> : null}

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 sm:px-5 sm:py-4">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-zinc-900">SEO Preview</h3>
                <p className="break-all text-xs text-zinc-600 sm:text-sm">Path: {targetPageUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
              <p className="mb-2 text-xs text-zinc-500">
                You can edit directly within the preview. Upon confirming the save, these edited tags will be saved.
              </p>
              <textarea
                value={previewDraft}
                onChange={(event) => setPreviewDraft(event.target.value)}
                className="min-h-[300px] w-full rounded-xl bg-zinc-950 p-3 font-mono text-xs text-zinc-100 outline-none ring-1 ring-zinc-700 focus:ring-2 focus:ring-[#2EA6F7] sm:min-h-[360px] sm:p-4"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-5 sm:py-4">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 sm:w-auto sm:py-2"
              >
                Close Preview
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const parsedData = parsePreviewToSeoData(previewDraft, formData, targetPageUrl);
                  setFormData(parsedData);
                  await handleSave(parsedData);
                  setIsPreviewOpen(false);
                }}
                className="w-full rounded-xl bg-[#cc2727] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#a91f1f] disabled:opacity-60 sm:w-auto sm:py-2"
              >
                {saving ? 'Saving...' : 'Confirm Save SEO'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
