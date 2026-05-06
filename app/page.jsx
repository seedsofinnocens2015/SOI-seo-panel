'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { FaCircle } from 'react-icons/fa';
import { HiChevronRight, HiPencilSquare, HiXMark } from 'react-icons/hi2';
import SeoForm from './components/SeoForm';
import { fetchSeo, fetchSeoStats, saveSeo } from '../lib/seoApi';
import {
  clearAuthSession,
  getAuthToken,
  getStoredUser,
  requestLoginOtp,
  requestSignupOtp,
  saveAuthSession,
  verifyLoginOtp,
  verifySignupOtp,
} from '../lib/authApi';

/** Sidebar opens the Home hub (table); real URLs are listed in HOME_SECTION_PAGES. */
const HOME_HUB_PAGE = '__seo_home_hub__';

const HOME_SECTION_PAGES = [
  { label: 'Home page', value: '/' },
  { label: 'female-faqs', value: '/female-faqs' },
  { label: 'genetic-faqs', value: '/genetic-faqs' },
  { label: 'learning-faqs', value: '/learning-faqs' },
  { label: 'male-faqs', value: '/male-faqs' },
];

/** Sidebar hub — table lives in INTERNATIONAL_PATIENTS_SECTION_PAGES. */
const INTERNATIONAL_PATIENTS_HUB_PAGE = '__seo_international_patients_hub__';

const INTERNATIONAL_PATIENTS_SECTION_PAGES = [
  { label: 'Patient Concierge', value: '/international-patients/patient-concierge' },
  { label: 'Travel Support', value: '/international-patients/travel-support' },
  { label: 'International Pricing', value: '/international-patients/international-pricing' },
  { label: 'Contact Team', value: '/international-patients/contact-team' },
];

const RESOURCES_HUB_PAGE = '__seo_resources_hub__';

const RESOURCES_SECTION_PAGES = [
  { label: 'IVF Process / Patient Journey', value: '/resources/ivf-process-patient-journey' },
  { label: 'FAQs', value: '/resources/faqs' },
  { label: 'Patient Testimonial Videos', value: '/resources/patient-testimonial-videos' },
  { label: 'Fertility Calculator', value: '/resources/fertility-calculator' },
];

const ABOUT_US_HUB_PAGE = '__seo_about_us_hub__';

const ABOUT_US_SECTION_PAGES = [
  { label: 'Our Story', value: '/about/our-story' },
  { label: 'Dr. Gauri Agrawal – Founder', value: '/ivf-doctor/dr-gauri-agarwal-ivf-specialist/' },
  { label: 'Leadership Team', value: '/about/leadership-team' },
  { label: 'Vision, Mission & Values', value: '/about/vision-mission-values' },
  { label: 'Success Rates', value: '/about/success-rates' },
  { label: 'Embryology Lab & Technology', value: '/about/embryology-lab-technology' },
  { label: 'Media & Press', value: '/about/media-press' },
  { label: 'Awards & Accreditations', value: '/about/awards-accreditations' },
];

const CONTACT_US_HUB_PAGE = '__seo_contact_us_hub__';

const CONTACT_US_SECTION_PAGES = [
  { label: 'Book Appointment', value: '/contact/book-appointment' },
  { label: 'Online Payment', value: '/contact/online-payment' },
  { label: 'WhatsApp', value: '/contact/whatsapp' },
  { label: 'Call Back Form', value: '/contact/call-back-form' },
  { label: 'Centre Locator', value: '/contact/centre-locator' },
  { label: 'Careers', value: '/contact/careers' },
  { label: 'Feedback', value: '/contact/feedback' },
];

const TRAINING_ACADEMY_HUB_PAGE = '__seo_training_academy_hub__';

const TRAINING_ACADEMY_SECTION_PAGES = [
  { label: 'Training Programs Academy', value: '/training-academy' },
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
];

const IVF_CENTRES_HUB_PAGE = '__seo_ivf_centres_hub__';

/** All IVF centre location pages (flat list; same order as previous tree: India regions, then international). */
const IVF_CENTRES_SECTION_PAGES = [
  { label: 'Delhi — Overview', value: '/best-ivf-centre-in-delhi' },
  { label: 'Delhi — Malviya Nagar, New Delhi', value: '/delhi/best-ivf-centre-in-malviyanagar/' },
  { label: 'Delhi — Pitampura, New Delhi', value: '/delhi/best-ivf-centre-in-pitampura/' },
  { label: 'Delhi — Janakpuri, New Delhi', value: '/delhi/best-ivf-centre-in-janakpuri/' },
  { label: 'Uttar Pradesh — Overview', value: '/best-ivf-centre-in-uttar-pradesh' },
  { label: 'Uttar Pradesh — Ghaziabad', value: '/uttar-pradesh/best-ivf-centre-in-ghaziabad/' },
  { label: 'Uttar Pradesh — Lucknow', value: '/uttar-pradesh/best-ivf-centre-in-lucknow/' },
  { label: 'Uttar Pradesh — Agra', value: '/uttar-pradesh/best-ivf-centre-in-agra/' },
  { label: 'Uttar Pradesh — Gorakhpur', value: '/uttar-pradesh/best-ivf-centre-in-gorakhpur/' },
  { label: 'Uttar Pradesh — Kanpur', value: '/uttar-pradesh/best-ivf-centre-in-kanpur/' },
  { label: 'Uttar Pradesh — Meerut', value: '/uttar-pradesh/best-ivf-centre-in-meerut/' },
  { label: 'Bihar — Overview', value: '/best-ivf-centre-in-bihar' },
  { label: 'Bihar — Patna', value: '/bihar/best-ivf-centre-in-patna/' },
  { label: 'Bihar — Muzaffarpur', value: '/bihar/best-ivf-centre-in-muzaffarpur/' },
  { label: 'Haryana — Overview', value: '/best-ivf-centre-in-haryana' },
  { label: 'Haryana — Faridabad', value: '/haryana/best-ivf-centre-in-faridabad/' },
  { label: 'Haryana — Gurugram', value: '/haryana/best-ivf-centre-in-gurugram/' },
  { label: 'Jharkhand — Overview', value: '/best-ivf-centre-in-jharkhand' },
  { label: 'Jharkhand — Ranchi', value: '/jharkhand/best-ivf-centre-in-ranchi/' },
  { label: 'Uttarakhand — Overview', value: '/best-ivf-centre-in-uttarakhand' },
  { label: 'Uttarakhand — Haldwani', value: '/uttarakhand/best-ivf-centre-in-haldwani/' },
  { label: 'Assam — Overview', value: '/best-ivf-centre-in-assam' },
  { label: 'Assam — Guwahati', value: '/assam/best-ivf-centre-in-guwahati/' },
  { label: 'Kerala — Overview', value: '/best-ivf-centre-in-kerala' },
  { label: 'Kerala — Kasaragod', value: '/kerala/best-ivf-centre-in-kasaragod/' },
  { label: 'Kerala — Kochi', value: '/kerala/best-ivf-centre-in-kochi/' },
  { label: 'Jammu & Kashmir — Overview', value: '/best-ivf-centre-in-jammu-kashmir' },
  { label: 'Jammu & Kashmir — Srinagar', value: '/jammu-kashmir/best-ivf-centre-in-srinagar/' },
  { label: 'West Bengal — Overview', value: '/best-ivf-centre-in-west-bengal' },
  { label: 'West Bengal — Kolkata', value: '/west-bengal/best-ivf-centre-in-kolkata/' },
  { label: 'International — Overview', value: '/ivf-centres/international' },
  { label: 'International — Mabela, Muscat, Oman', value: '/best-ivf-centre-in-mabela-muscat' },
];

const INFERTILITY_TREATMENT_HUB_PAGE = '__seo_infertility_treatment_hub__';

const INFERTILITY_TREATMENT_SECTION_PAGES = [
  { label: 'Fertility Treatments — IVF', value: '/fertility-treatments/ivf' },
  { label: 'Fertility Treatments — ICSI', value: '/fertility-treatments/icsi' },
  { label: 'Fertility Treatments — IUI', value: '/fertility-treatments/iui' },
  { label: 'Fertility Treatments — Monitoring in an IUI Cycle', value: '/fertility-treatments/monitoring-in-an-iui-cycle-steps' },
  { label: 'Fertility Treatments — Ovulation Induction', value: '/fertility-treatments/ovulation-induction' },
  { label: 'Fertility Treatments — Follicular Monitoring', value: '/fertility-treatments/follicular-monitoring' },
  { label: 'Fertility Treatments — Blastocyst Transfer', value: '/fertility-treatments/blastocyst-transfer' },
  { label: 'Fertility Treatments — Secondary Infertility', value: '/fertility-treatments/secondary-infertility' },
  { label: 'IVF Procedures & Preservation — Egg Freezing', value: '/ivf-procedures-preservation/egg-freezing' },
  { label: 'IVF Procedures & Preservation — Embryo Freezing', value: '/ivf-procedures-preservation/embryo-freezing' },
  { label: 'IVF Procedures & Preservation — Cryopreservation', value: '/ivf-procedures-preservation/cryopreservation' },
  { label: 'IVF Procedures & Preservation — PRP & Ovarian Rejuvenation', value: '/ivf-procedures-preservation/prp' },
  { label: 'IVF Procedures & Preservation — Surrogacy', value: '/ivf-procedures-preservation/surrogacy' },
  { label: 'IVF Procedures & Preservation — Donor Program', value: '/ivf-procedures-preservation/donor-program' },
  { label: 'Male Infertility Treatments — Male Infertility', value: '/male-infertility-treatments/male-infertility-treatment-in-india' },
  { label: 'Male Infertility Treatments — TESA / PESA', value: '/male-infertility-treatments/tesa-pesa' },
  { label: 'Male Infertility Treatments — MicroTESE', value: '/male-infertility-treatments/microtese' },
  { label: 'Male Infertility Treatments — Semen Analysis', value: '/male-infertility-treatments/semen-analysis' },
  { label: 'Male Infertility Treatments — Semen Analysis at Home', value: '/male-infertility-treatments/semen-analysis-at-home' },
  { label: 'Male Infertility Treatments — Varicocele', value: '/male-infertility-treatments/varicocele' },
  { label: 'Male Infertility Treatments — Vasectomy Reversal', value: '/male-infertility-treatments/vasectomy-reversal' },
  { label: 'Male Fertility Conditions — Azoospermia', value: '/male-fertility-conditions/azoospermia' },
  { label: 'Male Fertility Conditions — Non-Obstructive Azoospermia', value: '/male-fertility-conditions/non-obstructive-azoospermia' },
  { label: 'Male Fertility Conditions — Obstructive Azoospermia', value: '/male-fertility-conditions/obstructive-azoospermia' },
  { label: 'Male Fertility Conditions — Oligospermia', value: '/male-fertility-conditions/oligospermia' },
  { label: 'Male Fertility Conditions — Blocked Seminiferous Tubules', value: '/male-fertility-conditions/blocked-seminiferous-tubules' },
  { label: 'Male Fertility Conditions — Endocrinological Disorder in Men', value: '/male-fertility-conditions/endocrinological-disorder-in-men' },
  { label: 'Male Fertility Conditions — Retrograde Ejaculation', value: '/male-fertility-conditions/retrograde-ejaculation' },
  { label: 'Genetic Testing & Screening — Genetic Testing', value: '/genetic-testing-screening/genetic-testing' },
  { label: 'Genetic Testing & Screening — Genetic Factors', value: '/genetic-testing-screening/genetic-factors' },
  { label: 'Genetic Testing & Screening — PGT-A', value: '/genetic-testing-screening/pgt-a' },
  { label: 'Genetic Testing & Screening — PGT-M', value: '/genetic-testing-screening/pgt-m' },
  { label: 'Genetic Testing & Screening — PGT-SR', value: '/genetic-testing-screening/pgt-sr' },
  { label: 'Genetic Testing & Screening — Difference between PGT A & PGT-M', value: '/genetic-testing-screening/difference-between-pgt-a-and-pgt-m' },
  { label: 'Genetic Testing & Screening — Amniocentesis', value: '/genetic-testing-screening/amniocentesis' },
  { label: 'Genetic Testing & Screening — Chorionic Villus Sampling (CVS)', value: '/genetic-testing-screening/chorionic-villus-sampling-cvs' },
  { label: 'Genetic Testing & Screening — Couple Carrier Screening', value: '/genetic-testing-screening/couple-carrier-screening' },
  { label: 'Genetic Testing & Screening — Karyotyping', value: '/genetic-testing-screening/karyotyping' },
  { label: 'Genetic Testing & Screening — Microarray', value: '/genetic-testing-screening/microarray' },
  { label: 'Genetic Testing & Screening — HLA Matching', value: '/genetic-testing-screening/hla-matching' },
  { label: 'Maternal–Fetal Medicine (MFM) — High-Risk Pregnancy', value: '/maternal-fetal-medicine/high-risk-pregnancy' },
  { label: 'Maternal–Fetal Medicine (MFM) — Fetal Reduction', value: '/maternal-fetal-medicine/fetal-reduction' },
  { label: 'Maternal–Fetal Medicine (MFM) — MFM Scans & Diagnostics', value: '/maternal-fetal-medicine/maternal-and-fetal-medicine' },
  { label: 'Surgeries — Hysteroscopy', value: '/surgeries/hysteroscopy' },
  { label: 'Surgeries — Laparoscopy', value: '/surgeries/laparoscopy' },
  { label: 'Surgeries — Open Surgery', value: '/surgeries/open-surgery' },
  { label: 'Reproductive Health Conditions — Blocked Fallopian Tubes', value: '/reproductive-health-conditions/blocked-fallopian-tubes' },
  { label: 'Reproductive Health Conditions — PCOS (Polycystic Ovarian Syndrome)', value: '/reproductive-health-conditions/pcos-polycystic-ovarian-syndrome' },
  { label: 'Reproductive Health Conditions — Irregular Menstrual Cycle', value: '/reproductive-health-conditions/irregular-menstrual-cycle' },
  { label: 'Reproductive Health Conditions — Diabetes, Thyroid and Obesity', value: '/reproductive-health-conditions/diabetes-thyroid-and-obesity' },
  { label: 'Reproductive Health Conditions — Endometrial and Ovarian', value: '/reproductive-health-conditions/endometrial-and-ovarian' },
  { label: 'Reproductive Health Conditions — Endometriosis', value: '/reproductive-health-conditions/endometriosis' },
  { label: 'Reproductive Health Conditions — Fibroids, Polyps and Adenomyosis', value: '/reproductive-health-conditions/fibroids-polyps-and-adenomyosis' },
  { label: 'Reproductive Health Conditions — Tuberculosis', value: '/reproductive-health-conditions/tuberculosis' },
  { label: 'Reproductive Health Conditions — Recurrent Miscarriages', value: '/reproductive-health-conditions/recurrent-miscarriages' },
  { label: 'Reproductive Health Conditions — Why Delayed Periods But Not Pregnant', value: '/reproductive-health-conditions/reasons-for-delayed-periods-but-not-pregnant' },
  { label: 'Reproductive Health Conditions — What is Ovarian Hyperstimulation', value: '/reproductive-health-conditions/what-is-ovarian-hyperstimulation' },
  { label: 'Fertility Wellness — Boost Fertility With Colours Of Food', value: '/fertility-wellness/how-to-boost-up-fertility-with-the-colours-of-food' },
  { label: 'Fertility Wellness — Yoga and Fertility', value: '/fertility-wellness/yoga-and-fertility-heres-how-yoga-can-support-fertility' },
];

const SEO_HUB_PAGE_IDS = new Set([
  HOME_HUB_PAGE,
  INFERTILITY_TREATMENT_HUB_PAGE,
  INTERNATIONAL_PATIENTS_HUB_PAGE,
  IVF_CENTRES_HUB_PAGE,
  RESOURCES_HUB_PAGE,
  ABOUT_US_HUB_PAGE,
  CONTACT_US_HUB_PAGE,
  TRAINING_ACADEMY_HUB_PAGE,
]);

/** Maps hub sentinel → hub table UI (title, pages, theme, sidebar tip label). */
const SECTION_HUB_UI = {
  [HOME_HUB_PAGE]: {
    title: 'Home',
    pages: HOME_SECTION_PAGES,
    theme: 'emerald',
    tipSidebarLabel: 'Home',
  },
  [INTERNATIONAL_PATIENTS_HUB_PAGE]: {
    title: 'International Patients',
    pages: INTERNATIONAL_PATIENTS_SECTION_PAGES,
    theme: 'cyan',
    tipSidebarLabel: 'International Patients',
  },
  [IVF_CENTRES_HUB_PAGE]: {
    title: 'IVF Centres',
    pages: IVF_CENTRES_SECTION_PAGES,
    theme: 'indigo',
    tipSidebarLabel: 'IVF Centres',
  },
  [INFERTILITY_TREATMENT_HUB_PAGE]: {
    title: 'Infertility Treatment',
    pages: INFERTILITY_TREATMENT_SECTION_PAGES,
    theme: 'rose',
    tipSidebarLabel: 'Infertility Treatment',
  },
  [RESOURCES_HUB_PAGE]: {
    title: 'Resources',
    pages: RESOURCES_SECTION_PAGES,
    theme: 'amber',
    tipSidebarLabel: 'Resources',
  },
  [ABOUT_US_HUB_PAGE]: {
    title: 'About Us',
    pages: ABOUT_US_SECTION_PAGES,
    theme: 'violet',
    tipSidebarLabel: 'About Us',
  },
  [CONTACT_US_HUB_PAGE]: {
    title: 'Contact Us',
    pages: CONTACT_US_SECTION_PAGES,
    theme: 'orange',
    tipSidebarLabel: 'Contact Us',
  },
  [TRAINING_ACADEMY_HUB_PAGE]: {
    title: 'Training Academy',
    pages: TRAINING_ACADEMY_SECTION_PAGES,
    theme: 'teal',
    tipSidebarLabel: 'Training Academy',
  },
};

const PAGE_TREE = [
  {
    label: 'Home',
    value: HOME_HUB_PAGE,
  },
  {
    label: 'Infertility Treatment',
    value: INFERTILITY_TREATMENT_HUB_PAGE,
  },
  {
    label: 'IVF Centres',
    value: IVF_CENTRES_HUB_PAGE,
  },
  {
    label: 'International Patients',
    value: INTERNATIONAL_PATIENTS_HUB_PAGE,
  },
  {
    label: 'Resources',
    value: RESOURCES_HUB_PAGE,
  },
  {
    label: 'About Us',
    value: ABOUT_US_HUB_PAGE,
  },
  {
    label: 'Doctors',
    children: [
      { label: 'All IVF Specialists', value: '/ivf-doctor' },
      {
        label: 'All IVF Specialists - Profiles',
        children: [
          { label: 'Dr. Gauri Agarwal', value: '/ivf-doctor/dr-gauri-agarwal-ivf-specialist' },
          { label: 'Dr. Alpana Razadan', value: '/genetic-expert/dr-alpana-razadan' },
          { label: 'Dr. Lisha Singh', value: '/ivf-doctor/dr-lisha-singh-ivf-specialist' },
          { label: 'Dr. Monika Maan', value: '/ivf-doctor/dr-monika-mann-ivf-specialist' },
          { label: 'Dr. Pratik Kakani', value: '/ivf-doctor/dr-pratik-kakani-ivf-specialists' },
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
        ],
      },
      { label: 'Maternal-Fetal Medicine Specialists', value: '/ivf-doctor/maternal-fetal-medicine' },
      { label: 'Surgeon Panel', value: '/ivf-doctor/surgeon-panel' },
    ],
  },
  {
    label: 'Contact Us',
    value: CONTACT_US_HUB_PAGE,
  },
  {
    label: 'Training Academy',
    value: TRAINING_ACADEMY_HUB_PAGE,
  },
  { label: 'Thank You Page', value: '/thank-you' },
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
  };
  return accentMap[topLevelLabel] || 'from-zinc-300/30 to-transparent text-zinc-700';
}

function SidebarNode({
  node,
  selectedPage,
  expandedNodes,
  onToggle,
  onSelect,
  level = 0,
  parentTrail = [],
}) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const nodeKey = node.value || node.label;
  const isExpanded = expandedNodes[nodeKey];
  const isSelected = node.value && selectedPage === node.value;
  const childCount = hasChildren ? node.children.length : 0;
  const topLevelLabel = getTopLevelLabel(node, parentTrail);
  const accentClass = getSectionAccentClass(topLevelLabel);

  return (
    <li>
      <div
        className={`group flex items-center gap-2 rounded-xl transition ${
          level === 0 ? 'bg-white/70 px-2 py-1.5 ring-1 ring-zinc-100' : 'px-1 py-0.5'
        }`}
        style={{ marginLeft: `${Math.max(0, level - 1) * 10}px` }}
        onClick={() => {
          if (hasChildren && !node.value) {
            onToggle(nodeKey);
          }
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggle(nodeKey);
            }}
            className="grid h-5 w-5 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            <HiChevronRight
              aria-hidden
              className={`h-3.5 w-3.5 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <span className="flex w-4 shrink-0 justify-center" aria-hidden>
            <FaCircle className="h-1 w-1 text-zinc-300" />
          </span>
        )}

        {node.value ? (
          <button
            type="button"
            onClick={() => onSelect(node.value)}
            className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm ${
              isSelected
                ? 'bg-gradient-to-r from-[#df3655]/15 to-[#df3655]/5 font-semibold text-[#df3655] ring-1 ring-[#df3655]/20'
                : 'text-zinc-700 transition hover:bg-zinc-100/80'
            }`}
            title={node.value}
          >
            <span className="line-clamp-1">{node.label}</span>
          </button>
        ) : (
          <div
            className={`flex w-full cursor-pointer items-center justify-between rounded-lg bg-gradient-to-r px-2.5 py-1.5 ${accentClass}`}
            title="Click to expand/collapse"
          >
            <span className="text-sm font-semibold">{node.label}</span>
            {childCount > 0 ? (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-500 ring-1 ring-zinc-200">
                {childCount}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {hasChildren && isExpanded ? (
        <ul className="ml-2 mt-1 space-y-1 border-l border-zinc-200/80 pl-2">
          {node.children.map((child) => (
            <SidebarNode
              key={child.value || child.label}
              node={child}
              selectedPage={selectedPage}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
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

function sectionPagesToOptions(sectionPages, sectionLabel) {
  const searchKey = sectionLabel.toLowerCase();
  return sectionPages.map((p) => ({
    label: p.label,
    value: p.value,
    pathTrail: `${sectionLabel} > ${p.label}`,
    hierarchyPath: [sectionLabel],
    searchText: `${searchKey} ${p.label} ${p.value}`.toLowerCase(),
  }));
}

function mergePageOptionsFromTree(flatFromTree) {
  const restTree = flatFromTree.filter((x) => !SEO_HUB_PAGE_IDS.has(x.value));
  const injected = [
    ...sectionPagesToOptions(HOME_SECTION_PAGES, 'Home'),
    ...sectionPagesToOptions(INFERTILITY_TREATMENT_SECTION_PAGES, 'Infertility Treatment'),
    ...sectionPagesToOptions(INTERNATIONAL_PATIENTS_SECTION_PAGES, 'International Patients'),
    ...sectionPagesToOptions(IVF_CENTRES_SECTION_PAGES, 'IVF Centres'),
    ...sectionPagesToOptions(RESOURCES_SECTION_PAGES, 'Resources'),
    ...sectionPagesToOptions(ABOUT_US_SECTION_PAGES, 'About Us'),
    ...sectionPagesToOptions(CONTACT_US_SECTION_PAGES, 'Contact Us'),
    ...sectionPagesToOptions(TRAINING_ACADEMY_SECTION_PAGES, 'Training Academy'),
  ];
  const hubEntries = flatFromTree.filter((x) => SEO_HUB_PAGE_IDS.has(x.value));
  return [...restTree, ...injected, ...hubEntries];
}

const HUB_PANEL_THEMES = {
  emerald: {
    headerBg: 'from-emerald-50/40 via-white to-[#f8fbff]',
    rowHover: 'hover:bg-emerald-50/35',
    srRing: 'group-hover:ring-emerald-200/80',
  },
  cyan: {
    headerBg: 'from-cyan-50/40 via-white to-[#f8fbff]',
    rowHover: 'hover:bg-cyan-50/35',
    srRing: 'group-hover:ring-cyan-200/80',
  },
  amber: {
    headerBg: 'from-amber-50/50 via-white to-[#f8fbff]',
    rowHover: 'hover:bg-amber-50/40',
    srRing: 'group-hover:ring-amber-200/80',
  },
  violet: {
    headerBg: 'from-violet-50/40 via-white to-[#f8fbff]',
    rowHover: 'hover:bg-violet-50/35',
    srRing: 'group-hover:ring-violet-200/80',
  },
  orange: {
    headerBg: 'from-orange-50/40 via-white to-[#f8fbff]',
    rowHover: 'hover:bg-orange-50/35',
    srRing: 'group-hover:ring-orange-200/80',
  },
  teal: {
    headerBg: 'from-teal-50/40 via-white to-[#f8fbff]',
    rowHover: 'hover:bg-teal-50/35',
    srRing: 'group-hover:ring-teal-200/80',
  },
  indigo: {
    headerBg: 'from-indigo-50/50 via-white to-[#f8fbff]',
    rowHover: 'hover:bg-indigo-50/40',
    srRing: 'group-hover:ring-indigo-200/80',
  },
  rose: {
    headerBg: 'from-rose-50/45 via-white to-[#f8fbff]',
    rowHover: 'hover:bg-rose-50/40',
    srRing: 'group-hover:ring-rose-200/80',
  },
};

function SectionHubPanel({ title, description, pages, theme, tipSidebarLabel, onEdit }) {
  const t = HUB_PANEL_THEMES[theme] || HUB_PANEL_THEMES.emerald;
  const { headerBg, rowHover, srRing } = t;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)] ring-1 ring-zinc-100/80">
      <div className={`border-b border-zinc-100/90 bg-gradient-to-br ${headerBg} px-5 py-6 sm:px-8`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-[1.65rem]">{title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">{description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3 self-start rounded-2xl border border-zinc-200/80 bg-white/90 px-5 py-3 shadow-sm backdrop-blur-sm sm:flex-col sm:items-end sm:py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Total routes</p>
            <p className="text-3xl font-bold tabular-nums leading-none text-zinc-900">{pages.length}</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-zinc-50/50 shadow-inner">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-white/95 backdrop-blur-sm">
                  <th
                    scope="col"
                    className="w-[88px] border-b border-zinc-200 px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 sm:px-5"
                  >
                    Sr. no.
                  </th>
                  <th
                    scope="col"
                    className="border-b border-zinc-200 px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 sm:px-5"
                  >
                    Pages
                  </th>
                  <th
                    scope="col"
                    className="w-[120px] border-b border-zinc-200 px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-zinc-500 sm:px-5"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 bg-white">
                {pages.map((row, index) => (
                  <tr key={row.value} className={`group transition-colors ${rowHover}`}>
                    <td className="whitespace-nowrap px-4 py-4 align-middle sm:px-5">
                      <span
                        className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg bg-zinc-100 px-2 text-sm font-semibold tabular-nums text-zinc-700 ring-1 ring-zinc-200/80 transition group-hover:bg-white ${srRing}`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle sm:px-5">
                      <p className="font-semibold text-zinc-900">{row.label}</p>
                      <p className="mt-1 font-mono text-xs text-zinc-500">{row.value}</p>
                    </td>
                    <td className="px-4 py-4 text-right align-middle sm:px-5">
                      <button
                        type="button"
                        onClick={() => onEdit(row.value)}
                        aria-label="Edit SEO for this page"
                        title="Edit"
                        className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#df3655] to-[#e84d6a] text-white shadow-md shadow-[#df3655]/25 ring-1 ring-[#df3655]/20 transition hover:from-[#c92c49] hover:to-[#df3655] hover:shadow-lg hover:shadow-[#df3655]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#df3655]"
                      >
                        <HiPencilSquare aria-hidden className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-zinc-500">
          Tip: Select <span className="font-medium text-zinc-700">{tipSidebarLabel}</span> in the sidebar anytime to
          return here.
        </p>
      </div>
    </div>
  );
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

function getInitialSelectedPage() {
  if (typeof window === 'undefined') return DASHBOARD_PAGE;
  const savedPage = window.localStorage.getItem(SELECTED_PAGE_STORAGE_KEY);
  return savedPage || DASHBOARD_PAGE;
}

export default function HomePage() {
  const isHydrated = useSyncExternalStore(
    () => () => {},
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
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', otp: '' });
  const [otpTimer, setOtpTimer] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const [selectedPage, setSelectedPage] = useState(getInitialSelectedPage);
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
    Doctors: true,
  });

  const targetPageUrl = useMemo(() => selectedPage, [selectedPage]);
  const isDashboardView = selectedPage === DASHBOARD_PAGE;
  const isSectionHubView = SEO_HUB_PAGE_IDS.has(selectedPage);
  const activeSectionHub = SECTION_HUB_UI[selectedPage];
  const allPageOptions = useMemo(() => mergePageOptionsFromTree(flattenPageTree(PAGE_TREE)), []);
  const seoPageUrls = useMemo(
    () => allPageOptions.filter((item) => !SEO_HUB_PAGE_IDS.has(item.value)).map((item) => item.value),
    [allPageOptions]
  );
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
    return allPageOptions
      .filter((item) => !SEO_HUB_PAGE_IDS.has(item.value))
      .filter((item) => item.searchText.includes(query))
      .slice(0, 8);
  }, [allPageOptions, searchText]);
  const userInitials = useMemo(() => getUserInitials(currentUser?.name), [currentUser?.name]);
  const pageOptionByUrl = useMemo(
    () => new Map(allPageOptions.map((item) => [item.value, item])),
    [allPageOptions]
  );
  const updatedPageOptions = useMemo(
    () =>
      (dashboardStats.updatedPageUrls || [])
        .map((url) => pageOptionByUrl.get(url))
        .filter(Boolean),
    [dashboardStats.updatedPageUrls, pageOptionByUrl]
  );
  const notUpdatedPageOptions = useMemo(
    () =>
      (dashboardStats.notUpdatedPageUrls || [])
        .map((url) => pageOptionByUrl.get(url))
        .filter(Boolean),
    [dashboardStats.notUpdatedPageUrls, pageOptionByUrl]
  );
  function handleToggleNode(nodeKey) {
    setExpandedNodes((prev) => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  }

  function handleSelectFromSearch(item) {
    setSelectedPage(item.value);
    setSearchText(item.value);
    setShowSearchResults(false);
  }

  function startSidebarResize() {
    setIsResizingSidebar(true);
  }

  useEffect(() => {
    if (!isAuthenticated || isDashboardView || isSectionHubView) {
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
  }, [targetPageUrl, selectedHierarchyKey, isAuthenticated, isDashboardView, isSectionHubView]);

  useEffect(() => {
    if (!isAuthenticated || !allPageOptions.length) {
      return undefined;
    }

    let isCancelled = false;
    async function loadStats() {
      setStatsLoading(true);
      try {
        const stats = await fetchSeoStats(seoPageUrls);
        if (isCancelled) return;
        setDashboardStats({
          totalCount: stats?.totalCount || seoPageUrls.length,
          updatedCount: stats?.updatedCount || 0,
          notUpdatedCount:
            stats?.notUpdatedCount ?? Math.max(0, seoPageUrls.length - (stats?.updatedCount || 0)),
          updatedPageUrls: Array.isArray(stats?.updatedPageUrls) ? stats.updatedPageUrls : [],
          notUpdatedPageUrls: Array.isArray(stats?.notUpdatedPageUrls) ? stats.notUpdatedPageUrls : [],
        });
      } catch {
        if (isCancelled) return;
        setDashboardStats({
          totalCount: seoPageUrls.length,
          updatedCount: 0,
          notUpdatedCount: seoPageUrls.length,
          updatedPageUrls: [],
          notUpdatedPageUrls: [...seoPageUrls],
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
  }, [isAuthenticated, seoPageUrls]);

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
      };

      const response =
        authMode === 'signup'
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

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthInfo('');

    try {
      if (authStep === 'credentials') {
        const payload = {
          email: authForm.email.trim(),
          password: authForm.password,
        };

        if (authMode === 'signup') {
          const response = await requestSignupOtp({ ...payload, name: authForm.name.trim() });
          setOtpTimer(Number(response?.expiresInSeconds) || 60);
        } else {
          const response = await requestLoginOtp(payload);
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

        saveAuthSession(authResponse);
        setCurrentUser(authResponse.user || null);
        setIsAuthenticated(true);
        setSelectedPage(DASHBOARD_PAGE);
        setActiveDashboardList('all');
        setAuthForm({ name: '', email: '', password: '', otp: '' });
        setOtpTimer(0);
        setAuthStep('credentials');
      }
    } catch (error) {
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  }

  if (!isHydrated) {
    return (
      <main className="grid min-h-screen place-items-center bg-gradient-to-br from-[#f8fbff] via-white to-[#fff7f9] p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
          <p className="text-sm font-semibold text-zinc-700">Loading SEO Panel...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-gradient-to-br from-[#f8fbff] via-white to-[#fff7f9] p-4">
        <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
          <Image
            src="/Header Logo.svg"
            alt="Seeds of Innocence"
            width={280}
            height={86}
            priority
            className="mx-auto h-auto w-auto max-w-[280px]"
          />
          <h1 className="mt-4 text-center text-3xl font-bold text-zinc-900">SEO Panel Access</h1>
          <p className="mt-2 text-center text-base text-zinc-600">
            {authStep === 'credentials'
              ? `Please ${authMode === 'signup' ? 'create an account' : 'login'} to continue.`
              : 'Enter OTP sent to your email to continue.'}
          </p>

          <div className="mt-5 flex justify-center">
            <div className="inline-flex rounded-xl bg-zinc-100 p-1.5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthStep('credentials');
                setShowPassword(false);
                setOtpTimer(0);
                setAuthError('');
                setAuthInfo('');
                setAuthForm((prev) => ({ ...prev, otp: '' }));
              }}
              className={`rounded-lg px-6 py-2.5 text-base font-semibold ${
                authMode === 'login' ? 'bg-white text-[#df3655] shadow-sm' : 'text-zinc-600'
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
                setAuthForm((prev) => ({ ...prev, otp: '' }));
              }}
              className={`rounded-lg px-6 py-2.5 text-base font-semibold ${
                authMode === 'signup' ? 'bg-white text-[#df3655] shadow-sm' : 'text-zinc-600'
              }`}
            >
              Signup
            </button>
            </div>
          </div>

          <form className="mx-auto mt-6 w-full max-w-lg space-y-4" onSubmit={handleAuthSubmit}>
            {authStep === 'credentials' && authMode === 'signup' ? (
              <input
                type="text"
                name="name"
                value={authForm.name}
                onChange={handleAuthFieldChange}
                placeholder="Full name"
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base text-zinc-800 outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20"
              />
            ) : null}
            <input
              type="email"
              name="email"
              value={authForm.email}
              onChange={handleAuthFieldChange}
              placeholder="Email"
              disabled={authStep === 'otp'}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base text-zinc-800 outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20 disabled:cursor-not-allowed disabled:bg-zinc-100"
            />
            {authStep === 'credentials' ? (
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={authForm.password}
                    onChange={handleAuthFieldChange}
                    placeholder="Password"
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 pr-12 text-base text-zinc-800 outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20"
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
                <p className="mt-2 text-center text-sm text-zinc-500">Password minimum 10 characters hona chahiye.</p>
              </div>
            ) : (
              <div>
                <p className="mb-2 text-center text-sm font-semibold text-zinc-600">
                  OTP Timer: 00:{String(otpTimer).padStart(2, '0')}
                </p>
                <input
                  type="text"
                  name="otp"
                  value={authForm.otp}
                  onChange={handleAuthFieldChange}
                  placeholder="Enter 4-digit OTP"
                  maxLength={4}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-center text-base text-zinc-800 outline-none focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-xl bg-[#df3655] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#c92c49] disabled:opacity-60"
            >
              {authLoading
                ? 'Please wait...'
                : authStep === 'credentials'
                  ? authMode === 'signup'
                    ? 'Send OTP for Signup'
                    : 'Send OTP for Login'
                  : authMode === 'signup'
                    ? 'Verify OTP and Create Account'
                    : 'Verify OTP and Login'}
            </button>
            {authStep === 'otp' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={authLoading || otpTimer > 0}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base font-semibold text-zinc-700 transition hover:bg-zinc-100"
                >
                  Back
                </button>
              </div>
            ) : null}
          </form>

          {authInfo ? <p className="mt-4 text-center text-sm text-green-700">{authInfo}</p> : null}
          {authError ? <p className="mt-4 text-center text-sm text-red-600">{authError}</p> : null}
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-gradient-to-br from-[#f8fbff] via-white to-[#fff7f9]">
      <div className="flex h-full w-full">
        <aside
          className="relative flex h-full shrink-0 flex-col border-r border-zinc-200 bg-gradient-to-b from-white via-white to-zinc-50/70 p-4 shadow-sm backdrop-blur"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="shrink-0 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
            <Image
              src="/Header Logo.svg"
              alt="Seeds of Innocence"
              width={220}
              height={68}
              priority
              className="h-auto w-auto max-w-[210px]"
            />
            <p className="mt-2 text-xs text-zinc-500">Select a page path to edit SEO details.</p>
            <div className="mt-3 inline-flex items-center rounded-full bg-[#2EA6F7]/10 px-2.5 py-1 text-[11px] font-semibold text-[#1c7fbe]">
              Total Pages: {seoPageUrls.length}
            </div>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            <ul className="space-y-1.5 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPage(DASHBOARD_PAGE);
                    setActiveDashboardList('all');
                  }}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    isDashboardView
                      ? 'bg-gradient-to-r from-[#df3655]/15 to-[#df3655]/5 text-[#df3655] ring-1 ring-[#df3655]/20'
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
                  expandedNodes={expandedNodes}
                  onToggle={handleToggleNode}
                  onSelect={setSelectedPage}
                  parentTrail={[]}
                />
              ))}
            </ul>
          </div>

          <button
            type="button"
            onMouseDown={startSidebarResize}
            className={`absolute right-0 top-0 h-full w-2 translate-x-1/2 cursor-col-resize rounded-full transition ${
              isResizingSidebar ? 'bg-[#2EA6F7]/30' : 'bg-transparent hover:bg-[#2EA6F7]/20'
            }`}
            title="Drag to resize sidebar"
            aria-label="Resize sidebar"
          />
        </aside>

        <div className="h-full flex-1 overflow-y-auto">
          <div className="mx-auto h-full w-full max-w-[1200px] p-6">
            <div className="flex h-full flex-col bg-white p-6">
              <div className="shrink-0 border-b border-zinc-100 pb-4">
                <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_minmax(420px,560px)_auto] lg:items-start">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#2EA6F7]">Seeds of Innocence</p>
                    <h1 className="mt-1 text-2xl font-bold text-zinc-900">SEO Admin Panel</h1>
                    <p className="mt-2 text-sm text-zinc-600">
                      {isDashboardView || isSectionHubView ? 'Current view:' : 'Selected path:'}{' '}
                      <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-900">
                        {isDashboardView
                          ? 'Dashboard'
                          : activeSectionHub
                            ? activeSectionHub.title
                            : targetPageUrl}
                      </span>
                    </p>
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
                      disabled={isDashboardView || isSectionHubView}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-[#2EA6F7] focus:ring-2 focus:ring-[#2EA6F7]/20"
                    />

                    {showSearchResults && searchText.trim() && !isDashboardView && !isSectionHubView ? (
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

                  <div ref={userMenuRef} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen((prev) => !prev)}
                      className={`relative grid h-12 w-12 place-items-center rounded-full border bg-gradient-to-br text-sm font-extrabold text-white shadow-md transition ${
                        isUserMenuOpen
                          ? 'border-[#df3655]/40 from-[#df3655] to-[#f06a82] ring-4 ring-[#df3655]/20'
                          : 'border-zinc-200 from-[#2EA6F7] to-[#1c7fbe] hover:shadow-lg'
                      }`}
                      title="User menu"
                      aria-label="User menu"
                    >
                      {userInitials}
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                    </button>
                    {isUserMenuOpen ? (
                      <div className="absolute right-0 top-14 z-30 w-72 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
                        <div className="bg-gradient-to-r from-[#f8fbff] via-white to-[#fff3f6] px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Signed in as</p>
                          <p className="mt-1 text-sm font-bold text-zinc-900">{currentUser?.name || 'User'}</p>
                          <p className="mt-1 text-xs text-zinc-600">{currentUser?.email || 'No email'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="m-3 w-[calc(100%-24px)] rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
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
                          <table className="w-full border-collapse">
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
                                ? allPageOptions.filter((item) => !SEO_HUB_PAGE_IDS.has(item.value))
                                : activeDashboardList === 'updated'
                                  ? updatedPageOptions
                                  : notUpdatedPageOptions
                              ).map((item) => (
                                <tr key={`${item.value}-${item.pathTrail}`} className="odd:bg-white even:bg-zinc-50/40">
                                  <td className="border-b border-zinc-100 px-3 py-2 text-sm text-zinc-800">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPage(item.value)}
                                      className="text-left font-medium text-[#1c7fbe] hover:underline"
                                    >
                                      {item.label}
                                    </button>
                                  </td>
                                  <td className="border-b border-zinc-100 px-3 py-2 text-xs text-zinc-600">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPage(item.value)}
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
                ) : activeSectionHub ? (
                  <SectionHubPanel
                    title={activeSectionHub.title}
                    description="Each route has its own SEO record. Use the pencil icon to open the form for that URL."
                    pages={activeSectionHub.pages}
                    theme={activeSectionHub.theme}
                    tipSidebarLabel={activeSectionHub.tipSidebarLabel}
                    onEdit={setSelectedPage}
                  />
                ) : loading ? (
                  <p className="text-sm text-zinc-600">Loading SEO data...</p>
                ) : (
                  <form className="space-y-6">
                    <SeoForm
                      formData={formData}
                      onChange={handleFieldChange}
                    />

                    <div className="flex items-center gap-3 pb-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={openPreview}
                        className="rounded-xl bg-[#df3655] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c92c49] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Preview & Save SEO
                      </button>
                    </div>
                  </form>
                )}

                {successMessage ? <p className="mt-4 text-sm text-green-700">{successMessage}</p> : null}
                {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">SEO Preview</h3>
                <p className="text-sm text-zinc-600">Path: {targetPageUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                aria-label="Close preview"
                className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100"
              >
                <HiXMark aria-hidden className="h-6 w-6" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto p-5">
              <p className="mb-2 text-xs text-zinc-500">
              You can edit directly within the preview. Upon confirming the save, these edited tags will be saved.
              </p>
              <textarea
                value={previewDraft}
                onChange={(event) => setPreviewDraft(event.target.value)}
                className="min-h-[360px] w-full rounded-xl bg-zinc-950 p-4 font-mono text-xs text-zinc-100 outline-none ring-1 ring-zinc-700 focus:ring-2 focus:ring-[#2EA6F7]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
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
                className="rounded-xl bg-[#df3655] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c92c49] disabled:opacity-60"
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
