/**
 * i18n — Multilingual UI text for BharatSahay AI
 * Supports: en, hi, ta, te, kn, ml, bn, mr, gu, pa, ur, or, as
 */

export type Translations = Record<string, string>;
export interface DefinedTranslations {
  // ─── Landing Page ──────────────────────────────────
  nav_features: string;
  nav_languages: string;
  nav_how: string;
  nav_get_started: string;
  hero_badge: string;
  hero_subtitle_1: string;
  hero_subtitle_2: string;
  hero_desc: string;
  hero_start_free: string;
  hero_voice_demo: string;
  stat_languages: string;
  stat_schemes: string;
  stat_analysis_time: string;
  stat_grounded: string;
  features_title: string;
  features_subtitle: string;
  feature_eligibility: string;
  feature_eligibility_desc: string;
  feature_docs: string;
  feature_docs_desc: string;
  feature_deadline: string;
  feature_deadline_desc: string;
  feature_steps: string;
  feature_steps_desc: string;
  feature_voice: string;
  feature_voice_desc: string;
  feature_evidence: string;
  feature_evidence_desc: string;
  how_title: string;
  how_subtitle: string;
  how_step1_title: string;
  how_step1_desc: string;
  how_step2_title: string;
  how_step2_desc: string;
  how_step3_title: string;
  how_step3_desc: string;
  lang_section_badge: string;
  lang_section_title: string;
  lang_section_desc: string;
  cta_title: string;
  cta_desc: string;
  cta_btn: string;
  footer: string;

  // ─── Auth Page ─────────────────────────────────────
  auth_back: string;
  auth_subtitle: string;
  auth_sign_in: string;
  auth_register: string;
  auth_full_name: string;
  auth_name_placeholder: string;
  auth_email: string;
  auth_password: string;
  auth_pref_language: string;
  auth_signing_in: string;
  auth_creating: string;
  auth_create_account: string;
  auth_no_account: string;
  auth_have_account: string;
  auth_i_am: string;
  auth_role_student_desc: string;
  auth_role_citizen_desc: string;
  auth_role_farmer_desc: string;
  auth_role_business_desc: string;

  // ─── Profile Page ─────────────────────────────────
  prof_title: string;
  prof_subtitle: string;
  prof_role_student: string;
  prof_role_citizen: string;
  prof_role_farmer: string;
  prof_role_business: string;
  prof_account_details: string;
  prof_member_since: string;
  prof_pref_language: string;
  prof_save: string;
  prof_saved: string;
  prof_continue: string;
  prof_name: string;
  prof_email: string;
  prof_back: string;
  prof_saving: string;
  prof_lang_hint: string;
  prof_details_fmt: string;
  prof_eg: string;
  prof_select: string;
  prof_edit: string;
  prof_cancel: string;
  prof_no_data: string;
  prof_not_set: string;
  fld_education_level: string;
  fld_institution: string;
  fld_state: string;
  fld_annual_income: string;
  fld_category: string;
  fld_interests: string;
  fld_city: string;
  fld_age_group: string;
  fld_occupation: string;
  fld_district: string;
  fld_land_size: string;
  fld_crops: string;
  fld_irrigation: string;
  fld_business_name: string;
  fld_business_type: string;
  fld_employees: string;
  fld_annual_turnover: string;
  fld_gst_registered: string;

  // ─── Dashboard Page ────────────────────────────────
  dash_welcome: string;
  dash_upload_hint: string;
  dash_documents: string;
  dash_ready: string;
  dash_conversations: string;
  dash_language: string;
  dash_drop_pdf: string;
  dash_drop_hint: string;
  dash_click_upload: string;
  dash_upload_hint2: string;
  dash_uploading: string;
  dash_general_chat: string;
  dash_general_chat_hint: string;
  dash_no_docs: string;
  dash_no_convs: string;
  dash_chat: string;
  dash_loading: string;
  dash_status_ready: string;
  dash_status_processing: string;
  dash_status_pending: string;
  dash_status_failed: string;

  // ─── Chat Page ─────────────────────────────────────
  chat_header: string;
  chat_general: string;
  chat_ask_title: string;
  chat_ask_with_doc: string;
  chat_ask_without_doc: string;
  chat_input_placeholder: string;
  chat_stop_speaking: string;
  chat_voice_input: string;
  chat_stop_recording: string;
  chat_read_aloud: string;
  chat_insights: string;
  chat_helpful: string;
  chat_not_helpful: string;
  chat_loading_conv: string;
  chat_footer_note: string;
  chat_verify: string;
  chat_confidence: string;
  chat_eligibility: string;
  chat_conditions_met: string;
  chat_conditions_unmet: string;
  chat_missing_info: string;
  chat_status_eligible: string;
  chat_status_not_eligible: string;
  chat_status_uncertain: string;
  chat_source_page: string;
  chat_open_source: string;
  chat_deadline: string;
  chat_required_docs: string;
  chat_action_plan: string;
  chat_sources: string;

  // ─── Suggested Questions ───────────────────────────
  suggest_eligible: string;
  suggest_documents: string;
  suggest_deadline: string;
  suggest_how_apply: string;
  suggest_income_limit: string;
}

const en: Translations = {
  nav_features: 'Features',
  nav_languages: 'Languages',
  nav_how: 'How it works',
  nav_get_started: 'Get Started',
  hero_badge: 'BFWAI/HACK 26 • PS-06 — AI for Bharat in Indian Languages',
  hero_subtitle_1: 'Your Government AI',
  hero_subtitle_2: 'in Your Language',
  hero_desc: 'Upload any government scheme, scholarship, or welfare PDF and instantly get grounded eligibility checks, required documents, deadlines, and step-by-step action plans — in 13+ Indian languages.',
  hero_start_free: 'Start for Free',
  hero_voice_demo: 'Try Voice Demo',
  stat_languages: 'Indian Languages',
  stat_schemes: 'Scheme Types',
  stat_analysis_time: 'Analysis Time',
  stat_grounded: 'Grounded Answers',
  features_title: 'Powered by Gemini AI',
  features_subtitle: 'Strict grounding rules ensure every answer cites the exact page from your document. No hallucinations.',
  feature_eligibility: 'Eligibility Radar',
  feature_eligibility_desc: 'Instantly know if you qualify. See exactly which conditions you meet or miss, with direct document evidence.',
  feature_docs: 'Document Checklist',
  feature_docs_desc: 'Never miss a required document. Get an interactive checklist of every certificate, ID, and form needed.',
  feature_deadline: 'Deadline Countdown',
  feature_deadline_desc: 'Application deadlines extracted with source page citations, so you always know when to apply.',
  feature_steps: 'Step-by-Step Action Plan',
  feature_steps_desc: 'A numbered, actionable plan with government portal links — from application to approval.',
  feature_voice: 'Voice First',
  feature_voice_desc: 'Ask questions in your mother tongue using your microphone. Hear answers read aloud with TTS.',
  feature_evidence: 'Evidence Grounded',
  feature_evidence_desc: 'Every claim cites the exact document name and page number. Confidence scores flag uncertain answers.',
  how_title: 'How It Works',
  how_subtitle: 'Three steps to get your answer',
  how_step1_title: 'Upload Your PDF',
  how_step1_desc: 'Upload any government scheme notification, scholarship circular, or welfare document. Supports up to 25 MB.',
  how_step2_title: 'Ask in Your Language',
  how_step2_desc: 'Type or speak your question in English, Hindi, Tamil, Telugu, or any of 13 Indian languages.',
  how_step3_title: 'Get Your Action Plan',
  how_step3_desc: 'Receive a grounded answer with eligibility status, document checklist, deadline, and step-by-step plan — all sourced from your document.',
  lang_section_badge: '13+ Languages Supported',
  lang_section_title: 'Your Language, Your Rights',
  lang_section_desc: 'BharatSahay AI speaks the language of every Indian citizen — from Kashmir to Kanyakumari.',
  cta_title: 'Ready to Know Your Rights?',
  cta_desc: 'Join thousands of Indian citizens using BharatSahay AI to navigate government schemes with confidence.',
  cta_btn: 'Start Free — No Credit Card',
  footer: '© 2026 BharatSahay AI · BFWAI/HACK 26 PS-06 · Built with ❤️ for Bharat',

  auth_back: 'Back to Home',
  auth_subtitle: 'Multilingual Government AI',
  auth_sign_in: 'Sign In',
  auth_register: 'Register',
  auth_full_name: 'Full Name',
  auth_name_placeholder: 'Ramesh Kumar',
  auth_email: 'Email Address',
  auth_password: 'Password',
  auth_pref_language: 'Preferred Language',
  auth_signing_in: 'Signing In…',
  auth_creating: 'Creating Account…',
  auth_create_account: 'Create Account',
  auth_no_account: "Don't have an account?",
  auth_have_account: 'Already have an account?',
  auth_i_am: 'I am a…',
  auth_role_student_desc: 'Scholarships & education',
  auth_role_citizen_desc: 'Schemes & public services',
  auth_role_farmer_desc: 'Agriculture & subsidies',
  auth_role_business_desc: 'Licenses & compliance',

  prof_title: 'My Profile',
  prof_subtitle: 'Your role-based profile tailors scheme results, eligibility answers and chat suggestions to you.',
  prof_role_student: 'Student',
  prof_role_citizen: 'Citizen',
  prof_role_farmer: 'Farmer',
  prof_role_business: 'Business Owner',
  prof_account_details: 'Account',
  prof_member_since: 'Member since',
  prof_pref_language: 'Preferred language',
  prof_save: 'Save Profile',
  prof_saved: 'Profile saved',
  prof_continue: 'Continue to Dashboard',
  prof_name: 'Name',
  prof_email: 'Email',
  prof_back: 'Back',
  prof_saving: 'Saving…',
  prof_lang_hint: 'Used for answers, voice and the whole interface',
  prof_details_fmt: 'details',
  prof_eg: 'e.g.',
  prof_select: 'Select',
  prof_edit: 'Edit Profile',
  prof_cancel: 'Cancel',
  prof_no_data: 'Nothing filled yet — tap Edit Profile to add your details.',
  prof_not_set: 'Not set',
  fld_education_level: 'Education level',
  fld_institution: 'School / College',
  fld_state: 'State',
  fld_annual_income: 'Annual income',
  fld_category: 'Category',
  fld_interests: 'Fields of interest',
  fld_city: 'City / District',
  fld_age_group: 'Age group',
  fld_occupation: 'Occupation',
  fld_district: 'District',
  fld_land_size: 'Land size',
  fld_crops: 'Main crops',
  fld_irrigation: 'Irrigation',
  fld_business_name: 'Business name',
  fld_business_type: 'Business type',
  fld_employees: 'Employees',
  fld_annual_turnover: 'Annual turnover',
  fld_gst_registered: 'GST registered?',

  dash_welcome: 'Welcome back,',
  dash_upload_hint: 'Upload a government scheme PDF and ask questions in',
  dash_documents: 'Documents',
  dash_ready: 'Ready',
  dash_conversations: 'Conversations',
  dash_language: 'Language',
  dash_drop_pdf: 'Drop a PDF here or',
  dash_drop_hint: 'Government schemes, scholarships, welfare notifications · Max 25 MB',
  dash_click_upload: 'click to upload',
  dash_upload_hint2: 'PDF or image (PNG, JPG) · Government schemes, scholarships, notices · Max 25 MB',
  dash_uploading: 'Uploading & processing PDF…',
  dash_general_chat: 'General Chat',
  dash_general_chat_hint: 'Ask questions without uploading a document',
  dash_no_docs: 'No documents yet. Upload a PDF to get started.',
  dash_no_convs: 'No conversations yet. Start chatting!',
  dash_chat: 'Chat',
  dash_loading: 'Loading…',
  dash_status_ready: 'Ready',
  dash_status_processing: 'Processing…',
  dash_status_pending: 'Pending',
  dash_status_failed: 'Failed',

  chat_header: 'BharatSahay AI',
  chat_general: 'General Inquiry',
  chat_ask_title: 'Ask BharatSahay AI',
  chat_ask_with_doc: "I'll answer questions about \"{filename}\" with evidence from the document.",
  chat_ask_without_doc: 'Ask me about any government scheme, eligibility, or application process.',
  chat_input_placeholder: 'Ask in {lang}… (Enter to send, Shift+Enter for newline)',
  chat_stop_speaking: 'Stop speaking',
  chat_voice_input: 'Voice input',
  chat_stop_recording: 'Stop recording',
  chat_read_aloud: 'Read aloud',
  chat_insights: 'Insights',
  chat_helpful: 'Helpful',
  chat_not_helpful: 'Not helpful',
  chat_loading_conv: 'Loading conversation…',
  chat_footer_note: 'Answers grounded from your document · Always verify with official authority',
  chat_verify: 'Verify with official authority',
  chat_confidence: '% confidence',
  chat_eligibility: 'Eligibility',
  chat_conditions_met: '✓ Conditions Met',
  chat_conditions_unmet: '✗ Conditions Not Met',
  chat_missing_info: '? Missing Info',
  chat_status_eligible: 'ELIGIBLE',
  chat_status_not_eligible: 'NOT ELIGIBLE',
  chat_status_uncertain: 'UNCERTAIN',
  chat_source_page: 'Source: page {page}',
  chat_open_source: 'Open the original document at page {page}',
  chat_deadline: 'Deadline',
  chat_required_docs: 'Required Documents',
  chat_action_plan: 'Action Plan',
  chat_sources: 'Sources',

  suggest_eligible: 'Am I eligible for this scheme?',
  suggest_documents: 'What documents do I need?',
  suggest_deadline: 'What is the application deadline?',
  suggest_how_apply: 'How do I apply step by step?',
  suggest_income_limit: 'What is the income limit?',
};

const hi: Translations = {
  nav_features: 'विशेषताएं',
  nav_languages: 'भाषाएं',
  nav_how: 'कैसे काम करता है',
  nav_get_started: 'शुरू करें',
  hero_badge: 'BFWAI/HACK 26 • PS-06 — भारतीय भाषाओं में AI',
  hero_subtitle_1: 'आपकी सरकारी AI',
  hero_subtitle_2: 'आपकी भाषा में',
  hero_desc: 'कोई भी सरकारी योजना, छात्रवृत्ति या कल्याण PDF अपलोड करें और तुरंत पात्रता जांच, आवश्यक दस्तावेज, समय सीमा और चरण-दर-चरण कार्य योजना प्राप्त करें — 13+ भारतीय भाषाओं में।',
  hero_start_free: 'मुफ्त शुरू करें',
  hero_voice_demo: 'वॉइस डेमो आजमाएं',
  stat_languages: 'भारतीय भाषाएं',
  stat_schemes: 'योजना प्रकार',
  stat_analysis_time: 'विश्लेषण समय',
  stat_grounded: 'प्रमाणित उत्तर',
  features_title: 'Gemini AI द्वारा संचालित',
  features_subtitle: 'सख्त ग्राउंडिंग नियम सुनिश्चित करते हैं कि हर उत्तर आपके दस्तावेज़ के सटीक पृष्ठ का हवाला देता है।',
  feature_eligibility: 'पात्रता रडार',
  feature_eligibility_desc: 'तुरंत जानें कि आप योग्य हैं या नहीं। दस्तावेज़ प्रमाण के साथ देखें कि कौन सी शर्तें पूरी हुईं।',
  feature_docs: 'दस्तावेज़ चेकलिस्ट',
  feature_docs_desc: 'कोई भी आवश्यक दस्तावेज़ न छूटे। हर प्रमाणपत्र, ID और फॉर्म की चेकलिस्ट प्राप्त करें।',
  feature_deadline: 'समय सीमा काउंटडाउन',
  feature_deadline_desc: 'स्रोत पृष्ठ उद्धरणों के साथ आवेदन की अंतिम तिथियां, ताकि आप हमेशा जानें कि कब आवेदन करना है।',
  feature_steps: 'चरण-दर-चरण कार्य योजना',
  feature_steps_desc: 'सरकारी पोर्टल लिंक के साथ एक क्रमांकित, कार्रवाई योग्य योजना — आवेदन से अनुमोदन तक।',
  feature_voice: 'वॉइस फर्स्ट',
  feature_voice_desc: 'अपने माइक्रोफोन का उपयोग करके अपनी मातृभाषा में प्रश्न पूछें। TTS के साथ उत्तर सुनें।',
  feature_evidence: 'प्रमाण आधारित',
  feature_evidence_desc: 'हर दावा सटीक दस्तावेज़ नाम और पृष्ठ संख्या का हवाला देता है।',
  how_title: 'यह कैसे काम करता है',
  how_subtitle: 'तीन चरणों में अपना उत्तर पाएं',
  how_step1_title: 'अपना PDF अपलोड करें',
  how_step1_desc: 'कोई भी सरकारी योजना अधिसूचना, छात्रवृत्ति परिपत्र या कल्याण दस्तावेज़ अपलोड करें। 25 MB तक।',
  how_step2_title: 'अपनी भाषा में पूछें',
  how_step2_desc: 'हिंदी, अंग्रेजी, तमिल, तेलुगु या 13 भारतीय भाषाओं में से किसी में टाइप करें या बोलें।',
  how_step3_title: 'अपनी कार्य योजना पाएं',
  how_step3_desc: 'पात्रता स्थिति, दस्तावेज़ चेकलिस्ट, समय सीमा और चरण-दर-चरण योजना के साथ प्रमाणित उत्तर प्राप्त करें।',
  lang_section_badge: '13+ भाषाएं समर्थित',
  lang_section_title: 'आपकी भाषा, आपके अधिकार',
  lang_section_desc: 'BharatSahay AI हर भारतीय नागरिक की भाषा बोलता है — कश्मीर से कन्याकुमारी तक।',
  cta_title: 'अपने अधिकार जानने के लिए तैयार?',
  cta_desc: 'हजारों भारतीय नागरिकों के साथ जुड़ें जो सरकारी योजनाओं को आत्मविश्वास से समझ रहे हैं।',
  cta_btn: 'मुफ्त शुरू करें — कोई क्रेडिट कार्ड नहीं',
  footer: '© 2026 BharatSahay AI · BFWAI/HACK 26 PS-06 · ❤️ से भारत के लिए बनाया',

  auth_back: 'होम पर वापस जाएं',
  auth_subtitle: 'बहुभाषी सरकारी AI',
  auth_sign_in: 'साइन इन',
  auth_register: 'रजिस्टर',
  auth_full_name: 'पूरा नाम',
  auth_name_placeholder: 'रमेश कुमार',
  auth_email: 'ईमेल पता',
  auth_password: 'पासवर्ड',
  auth_pref_language: 'पसंदीदा भाषा',
  auth_signing_in: 'साइन इन हो रहा है…',
  auth_creating: 'खाता बनाया जा रहा है…',
  auth_create_account: 'खाता बनाएं',
  auth_no_account: 'खाता नहीं है?',
  auth_have_account: 'पहले से खाता है?',
  auth_i_am: 'मैं हूँ…',
  auth_role_student_desc: 'छात्रवृत्ति और शिक्षा',
  auth_role_citizen_desc: 'योजनाएं और सार्वजनिक सेवाएं',
  auth_role_farmer_desc: 'कृषि और सब्सिडी',
  auth_role_business_desc: 'लाइसेंस और अनुपालन',

  prof_title: 'मेरी प्रोफ़ाइल',
  prof_subtitle: 'आपकी भूमिका-आधारित प्रोफ़ाइल योजनाओं, पात्रता और सुझावों को आपके लिए बेहतर बनाती है।',
  prof_role_student: 'छात्र',
  prof_role_citizen: 'नागरिक',
  prof_role_farmer: 'किसान',
  prof_role_business: 'व्यापारी',
  prof_account_details: 'खाता विवरण',
  prof_member_since: 'सदस्य बने',
  prof_pref_language: 'पसंदीदा भाषा',
  prof_save: 'प्रोफ़ाइल सहेजें',
  prof_saved: 'प्रोफ़ाइल सहेजी गई',
  prof_continue: 'डैशबोर्ड पर जाएं',
  prof_name: 'नाम',
  prof_email: 'ईमेल',
  prof_back: 'वापस',
  prof_saving: 'सहेज रहे हैं…',
  prof_lang_hint: 'उत्तरों, आवाज़ और पूरे इंटरफ़ेस के लिए उपयोग होती है',
  prof_details_fmt: 'विवरण',
  prof_eg: 'जैसे:',
  prof_select: 'चुनें',
  prof_edit: 'प्रोफ़ाइल संपादित करें',
  prof_cancel: 'रद्द करें',
  prof_no_data: 'अभी कुछ नहीं भरा गया — विवरण जोड़ने के लिए प्रोफ़ाइल संपादित करें।',
  prof_not_set: 'सेट नहीं है',
  fld_education_level: 'शिक्षा स्तर',
  fld_institution: 'स्कूल / कॉलेज',
  fld_state: 'राज्य',
  fld_annual_income: 'वार्षिक आय',
  fld_category: 'श्रेणी',
  fld_interests: 'रुचि के क्षेत्र',
  fld_city: 'शहर / जिला',
  fld_age_group: 'आयु समूह',
  fld_occupation: 'व्यवसाय',
  fld_district: 'जिला',
  fld_land_size: 'भूमि का आकार',
  fld_crops: 'मुख्य फसलें',
  fld_irrigation: 'सिंचाई',
  fld_business_name: 'व्यापार का नाम',
  fld_business_type: 'व्यापार का प्रकार',
  fld_employees: 'कर्मचारी',
  fld_annual_turnover: 'वार्षिक कारोबार',
  fld_gst_registered: 'GST पंजीकृत?',

  dash_welcome: 'वापस स्वागत है,',
  dash_upload_hint: 'सरकारी योजना PDF अपलोड करें और प्रश्न पूछें',
  dash_documents: 'दस्तावेज़',
  dash_ready: 'तैयार',
  dash_conversations: 'बातचीत',
  dash_language: 'भाषा',
  dash_drop_pdf: 'यहां PDF ड्रॉप करें या',
  dash_drop_hint: 'सरकारी योजनाएं, छात्रवृत्तियां, कल्याण अधिसूचनाएं · अधिकतम 25 MB',
  dash_click_upload: 'अपलोड करने के लिए क्लिक करें',
  dash_upload_hint2: 'PDF या इमेज (PNG, JPG) · सरकारी योजनाएं, छात्रवृत्तियां, सूचनाएं · अधिकतम 25 MB',
  dash_uploading: 'PDF अपलोड और प्रोसेस हो रहा है…',
  dash_general_chat: 'सामान्य चैट',
  dash_general_chat_hint: 'बिना दस्तावेज़ अपलोड किए प्रश्न पूछें',
  dash_no_docs: 'अभी कोई दस्तावेज़ नहीं। शुरू करने के लिए PDF अपलोड करें।',
  dash_no_convs: 'अभी कोई बातचीत नहीं। चैट शुरू करें!',
  dash_chat: 'चैट',
  dash_loading: 'लोड हो रहा है…',
  dash_status_ready: 'तैयार',
  dash_status_processing: 'प्रोसेसिंग…',
  dash_status_pending: 'लंबित',
  dash_status_failed: 'विफल',

  chat_header: 'BharatSahay AI',
  chat_general: 'सामान्य पूछताछ',
  chat_ask_title: 'BharatSahay AI से पूछें',
  chat_ask_with_doc: 'मैं "{filename}" के बारे में दस्तावेज़ से प्रमाण के साथ उत्तर दूंगा।',
  chat_ask_without_doc: 'किसी भी सरकारी योजना, पात्रता, या आवेदन प्रक्रिया के बारे में पूछें।',
  chat_input_placeholder: '{lang} में पूछें… (भेजने के लिए Enter, नई लाइन के लिए Shift+Enter)',
  chat_stop_speaking: 'बोलना बंद करें',
  chat_voice_input: 'वॉइस इनपुट',
  chat_stop_recording: 'रिकॉर्डिंग बंद करें',
  chat_read_aloud: 'ज़ोर से पढ़ें',
  chat_insights: 'जानकारी',
  chat_helpful: 'सहायक',
  chat_not_helpful: 'सहायक नहीं',
  chat_loading_conv: 'बातचीत लोड हो रही है…',
  chat_footer_note: 'दस्तावेज़ से प्रमाणित उत्तर · हमेशा अधिकारिक प्राधिकरण से सत्यापित करें',
  chat_verify: 'अधिकारिक प्राधिकरण से सत्यापित करें',
  chat_confidence: '% विश्वास',
  chat_eligibility: 'पात्रता',
  chat_conditions_met: '✓ शर्तें पूरी',
  chat_conditions_unmet: '✗ शर्तें अपूर्ण',
  chat_missing_info: '? जानकारी अनुपलब्ध',
  chat_status_eligible: 'पात्र',
  chat_status_not_eligible: 'पात्र नहीं',
  chat_status_uncertain: 'अनिश्चित',
  chat_source_page: 'स्रोत: पृष्ठ {page}',
  chat_open_source: 'मूल दस्तावेज़ पृष्ठ {page} पर खोलें',
  chat_deadline: 'समय सीमा',
  chat_required_docs: 'आवश्यक दस्तावेज़',
  chat_action_plan: 'कार्य योजना',
  chat_sources: 'स्रोत',

  suggest_eligible: 'क्या मैं इस योजना के लिए पात्र हूं?',
  suggest_documents: 'मुझे कौन से दस्तावेज़ चाहिए?',
  suggest_deadline: 'आवेदन की अंतिम तिथि क्या है?',
  suggest_how_apply: 'मैं चरण-दर-चरण कैसे आवेदन करूं?',
  suggest_income_limit: 'आय सीमा क्या है?',
};

const ta: Translations = {
  nav_features: 'அம்சங்கள்',
  nav_languages: 'மொழிகள்',
  nav_how: 'எப்படி வேலை செய்கிறது',
  nav_get_started: 'தொடங்கு',
  hero_badge: 'BFWAI/HACK 26 • PS-06 — இந்திய மொழிகளில் AI',
  hero_subtitle_1: 'உங்கள் அரசு AI',
  hero_subtitle_2: 'உங்கள் மொழியில்',
  hero_desc: 'எந்தவொரு அரசு திட்டம், உதவித்தொகை அல்லது நலத்திட்ட PDF-ஐ பதிவேற்றி, 13+ இந்திய மொழிகளில் தகுதி சோதனை, ஆவணங்கள், காலக்கெடு மற்றும் படிப்படியான செயல் திட்டத்தைப் பெறுங்கள்.',
  hero_start_free: 'இலவசமாக தொடங்கு',
  hero_voice_demo: 'குரல் டெமோ முயற்சிக்கவும்',
  stat_languages: 'இந்திய மொழிகள்',
  stat_schemes: 'திட்ட வகைகள்',
  stat_analysis_time: 'பகுப்பாய்வு நேரம்',
  stat_grounded: 'ஆதார பதில்கள்',
  features_title: 'Gemini AI மூலம் இயக்கப்படுகிறது',
  features_subtitle: 'ஒவ்வொரு பதிலும் உங்கள் ஆவணத்தின் சரியான பக்கத்தை மேற்கோள் காட்டும்.',
  feature_eligibility: 'தகுதி ரேடார்',
  feature_eligibility_desc: 'நீங்கள் தகுதியானவரா என்பதை உடனடியாக அறியுங்கள்.',
  feature_docs: 'ஆவண சரிபார்ப்பு',
  feature_docs_desc: 'தேவையான ஒவ்வொரு சான்றிதழ், அடையாளம் மற்றும் படிவத்தின் பட்டியல் பெறுங்கள்.',
  feature_deadline: 'காலக்கெடு கவுண்ட்டவுன்',
  feature_deadline_desc: 'விண்ணப்ப காலக்கெடுகள் மூலப் பக்க மேற்கோள்களுடன் பிரித்தெடுக்கப்படும்.',
  feature_steps: 'படிப்படியான செயல் திட்டம்',
  feature_steps_desc: 'அரசு போர்ட்டல் இணைப்புகளுடன் எண்ணிட்ட செயல் திட்டம்.',
  feature_voice: 'குரல் முதலில்',
  feature_voice_desc: 'உங்கள் தாய்மொழியில் கேள்விகளை கேளுங்கள். TTS மூலம் பதில்களைக் கேளுங்கள்.',
  feature_evidence: 'ஆதாரம் அடிப்படை',
  feature_evidence_desc: 'ஒவ்வொரு உரிமையும் சரியான ஆவண பெயர் மற்றும் பக்க எண்ணை மேற்கோள் காட்டும்.',
  how_title: 'இது எப்படி வேலை செய்கிறது',
  how_subtitle: 'மூன்று படிகளில் உங்கள் பதிலைப் பெறுங்கள்',
  how_step1_title: 'உங்கள் PDF-ஐ பதிவேற்றுங்கள்',
  how_step1_desc: 'எந்தவொரு அரசு திட்ட அறிவிப்பு, உதவித்தொகை சுற்றறிக்கை அல்லது நலத்திட்ட ஆவணத்தை பதிவேற்றுங்கள்.',
  how_step2_title: 'உங்கள் மொழியில் கேளுங்கள்',
  how_step2_desc: 'தமிழ், ஆங்கிலம், இந்தி அல்லது 13 இந்திய மொழிகளில் தட்டச்சு செய்யுங்கள் அல்லது பேசுங்கள்.',
  how_step3_title: 'உங்கள் செயல் திட்டத்தைப் பெறுங்கள்',
  how_step3_desc: 'தகுதி நிலை, ஆவண சரிபார்ப்புப் பட்டியல், காலக்கெடு மற்றும் படிப்படியான திட்டத்துடன் பதிலைப் பெறுங்கள்.',
  lang_section_badge: '13+ மொழிகள் ஆதரிக்கப்படுகின்றன',
  lang_section_title: 'உங்கள் மொழி, உங்கள் உரிமைகள்',
  lang_section_desc: 'BharatSahay AI ஒவ்வொரு இந்திய குடிமகனின் மொழியையும் பேசுகிறது.',
  cta_title: 'உங்கள் உரிமைகளை அறிய தயாரா?',
  cta_desc: 'ஆயிரக்கணக்கான இந்திய குடிமக்களுடன் சேருங்கள்.',
  cta_btn: 'இலவசமாக தொடங்கு',
  footer: '© 2026 BharatSahay AI · ❤️ உடன் பாரதத்திற்காக',

  auth_back: 'முகப்புக்கு திரும்பு',
  auth_subtitle: 'பல மொழி அரசு AI',
  auth_sign_in: 'உள்நுழை',
  auth_register: 'பதிவு செய்',
  auth_full_name: 'முழு பெயர்',
  auth_name_placeholder: 'ராமேஷ் குமார்',
  auth_email: 'மின்னஞ்சல்',
  auth_password: 'கடவுச்சொல்',
  auth_pref_language: 'விருப்ப மொழி',
  auth_signing_in: 'உள்நுழைகிறது…',
  auth_creating: 'கணக்கு உருவாக்கப்படுகிறது…',
  auth_create_account: 'கணக்கு உருவாக்கு',
  auth_no_account: 'கணக்கு இல்லையா?',
  auth_have_account: 'ஏற்கனவே கணக்கு உள்ளதா?',
  auth_i_am: 'நான்…',
  auth_role_student_desc: 'உதவித்தொகை மற்றும் கல்வி',
  auth_role_citizen_desc: 'திட்டங்கள் மற்றும் பொது சேவைகள்',
  auth_role_farmer_desc: 'விவசாயம் மற்றும் மானியங்கள்',
  auth_role_business_desc: 'உரிமங்கள் மற்றும் இணக்கம்',

  prof_title: 'எனது சுயவிவரம்',
  prof_subtitle: 'உங்கள் பங்கு அடிப்படையிலான சுயவிவரம் திட்டங்கள், தகுதி மற்றும் பரிந்துரைகளை உங்களுக்கேத் தருகிறது.',
  prof_role_student: 'மாணவர்',
  prof_role_citizen: 'குடிமகன்',
  prof_role_farmer: 'விவசாயி',
  prof_role_business: 'வணிகர்',
  prof_account_details: 'கணக்கு விவரங்கள்',
  prof_member_since: 'உறுப்பினர் தொடங்கியது',
  prof_pref_language: 'விருப்ப மொழி',
  prof_save: 'சுயவிவரத்தைச் சேமி',
  prof_saved: 'சுயவிவரம் சேமிக்கப்பட்டது',
  prof_continue: 'டாஷ்போர்டுக்குத் தொடரவும்',
  prof_name: 'பெயர்',
  prof_email: 'மின்னஞ்சல்',
  prof_back: 'பின்செல்',
  prof_saving: 'சேமிக்கிறது…',
  prof_lang_hint: 'பதில்கள், குரல் மற்றும் முழு இடைமுகத்திற்கும் பயன்படும்',
  prof_details_fmt: 'விவரங்கள்',
  prof_eg: 'எ.கா.',
  prof_select: 'தேர்வு',
  prof_edit: 'சுயவிவரத்தைத் திருத்து',
  prof_cancel: 'ரத்து',
  prof_no_data: 'இன்னும் எதுவும் நிரப்பப்படவில்லை — விவரங்களைச் சேர்க்க சுயவிவரத்தைத் திருத்தவும்.',
  prof_not_set: 'அமைக்கவில்லை',
  fld_education_level: 'கல்வி நிலை',
  fld_institution: 'பள்ளி / கல்லூரி',
  fld_state: 'மாநிலம்',
  fld_annual_income: 'ஆண்டு வருமானம்',
  fld_category: 'பிரிவு',
  fld_interests: 'ஆர்வமுள்ள துறைகள்',
  fld_city: 'நகரம் / மாவட்டம்',
  fld_age_group: 'வயது வரம்பு',
  fld_occupation: 'தொழில்',
  fld_district: 'மாவட்டம்',
  fld_land_size: 'நில அளவு',
  fld_crops: 'முக்கிய பயிர்கள்',
  fld_irrigation: 'பாசனம்',
  fld_business_name: 'வணிகப் பெயர்',
  fld_business_type: 'வணிக வகை',
  fld_employees: 'ஊழியர்கள்',
  fld_annual_turnover: 'ஆண்டு வருவாய்',
  fld_gst_registered: 'GST பதிவு?',

  dash_welcome: 'மீண்டும் வரவேற்கிறோம்,',
  dash_upload_hint: 'அரசு திட்ட PDF பதிவேற்றி கேள்விகள் கேளுங்கள்',
  dash_documents: 'ஆவணங்கள்',
  dash_ready: 'தயார்',
  dash_conversations: 'உரையாடல்கள்',
  dash_language: 'மொழி',
  dash_drop_pdf: 'PDF-ஐ இங்கு இடவும் அல்லது',
  dash_drop_hint: 'அரசு திட்டங்கள், உதவித்தொகைகள் · அதிகபட்சம் 25 MB',
  dash_click_upload: 'பதிவேற்ற கிளிக் செய்யவும்',
  dash_upload_hint2: 'PDF அல்லது படம் (PNG, JPG) · அரசு திட்டங்கள், உதவித்தொகைகள், அறிவிப்புகள் · அதிகபட்சம் 25 MB',
  dash_uploading: 'PDF பதிவேற்றப்படுகிறது…',
  dash_general_chat: 'பொது உரையாடல்',
  dash_general_chat_hint: 'ஆவணம் இல்லாமல் கேள்விகள் கேளுங்கள்',
  dash_no_docs: 'ஆவணங்கள் இல்லை. PDF பதிவேற்றுங்கள்.',
  dash_no_convs: 'உரையாடல்கள் இல்லை. உரையாடலைத் தொடங்குங்கள்!',
  dash_chat: 'உரையாடு',
  dash_loading: 'ஏற்றுகிறது…',
  dash_status_ready: 'தயார்',
  dash_status_processing: 'செயலாக்கம்…',
  dash_status_pending: 'நிலுவை',
  dash_status_failed: 'தோல்வி',

  chat_header: 'BharatSahay AI',
  chat_general: 'பொது விசாரணை',
  chat_ask_title: 'BharatSahay AI-யிடம் கேளுங்கள்',
  chat_ask_with_doc: '"{filename}" பற்றிய கேள்விகளுக்கு ஆவணத்திலிருந்து ஆதாரத்துடன் பதிலளிப்பேன்.',
  chat_ask_without_doc: 'எந்த அரசு திட்டம், தகுதி அல்லது விண்ணப்ப செயல்முறை பற்றியும் கேளுங்கள்.',
  chat_input_placeholder: '{lang} இல் கேளுங்கள்… (Enter அனுப்ப, Shift+Enter புதிய வரி)',
  chat_stop_speaking: 'பேசுவதை நிறுத்து',
  chat_voice_input: 'குரல் உள்ளீடு',
  chat_stop_recording: 'பதிவை நிறுத்து',
  chat_read_aloud: 'சத்தமாக படி',
  chat_insights: 'நுண்ணறிவுகள்',
  chat_helpful: 'உதவிகரமான',
  chat_not_helpful: 'உதவிகரமானது அல்ல',
  chat_loading_conv: 'உரையாடல் ஏற்றப்படுகிறது…',
  chat_footer_note: 'ஆவணத்திலிருந்து ஆதார பதில்கள் · உத்தியோகபூர்வ அதிகாரத்துடன் சரிபார்க்கவும்',
  chat_verify: 'உத்தியோகபூர்வ அதிகாரத்துடன் சரிபார்க்கவும்',
  chat_confidence: '% நம்பிக்கை',
  chat_eligibility: 'தகுதி',
  chat_conditions_met: '✓ நிபந்தனைகள் பூர்த்தி',
  chat_conditions_unmet: '✗ நிபந்தனைகள் பூர்த்தியாகவில்லை',
  chat_missing_info: '? தகவல் இல்லை',
  chat_status_eligible: 'தகுதி உடையது',
  chat_status_not_eligible: 'தகுதியற்றது',
  chat_status_uncertain: 'உறுதியற்றது',
  chat_source_page: 'மூலம்: பக்கம் {page}',
  chat_open_source: 'அசல் ஆவணத்தை பக்கம் {page} இல் திறக்க',
  chat_deadline: 'காலக்கெடு',
  chat_required_docs: 'தேவையான ஆவணங்கள்',
  chat_action_plan: 'செயல் திட்டம்',
  chat_sources: 'ஆதாரங்கள்',

  suggest_eligible: 'நான் இந்தத் திட்டத்திற்கு தகுதியானவனா?',
  suggest_documents: 'எனக்கு என்ன ஆவணங்கள் தேவை?',
  suggest_deadline: 'விண்ணப்பத்தின் கடைசி தேதி என்ன?',
  suggest_how_apply: 'படிப்படியாக எப்படி விண்ணப்பிப்பது?',
  suggest_income_limit: 'வருமான வரம்பு என்ன?',
};

const te: Translations = {
  nav_features: 'ఫీచర్లు',
  nav_languages: 'భాషలు',
  nav_how: 'ఎలా పనిచేస్తుంది',
  nav_get_started: 'ప్రారంభించండి',
  hero_badge: 'BFWAI/HACK 26 • PS-06 — భారతీయ భాషల్లో AI',
  hero_subtitle_1: 'మీ ప్రభుత్వ AI',
  hero_subtitle_2: 'మీ భాషలో',
  hero_desc: 'ఏదైనా ప్రభుత్వ పథకం, స్కాలర్‌షిప్ లేదా సంక్షేమ PDF అప్‌లోడ్ చేసి 13+ భారతీయ భాషల్లో అర్హత తనిఖీ, పత్రాలు, గడువు మరియు దశల వారీ ప్రణాళిక పొందండి.',
  hero_start_free: 'ఉచితంగా ప్రారంభించండి',
  hero_voice_demo: 'వాయిస్ డెమో ప్రయత్నించండి',
  stat_languages: 'భారతీయ భాషలు',
  stat_schemes: 'పథక రకాలు',
  stat_analysis_time: 'విశ్లేషణ సమయం',
  stat_grounded: 'ఆధార సమాధానాలు',
  features_title: 'Gemini AI ద్వారా',
  features_subtitle: 'ప్రతి సమాధానం మీ పత్రం యొక్క సరైన పేజీని ఉదహరిస్తుంది.',
  feature_eligibility: 'అర్హత రాడార్',
  feature_eligibility_desc: 'మీరు అర్హులో కాదో తక్షణమే తెలుసుకోండి.',
  feature_docs: 'పత్ర చెక్‌లిస్ట్',
  feature_docs_desc: 'అవసరమైన ప్రతి సర్టిఫికేట్, ID మరియు ఫారం జాబితా పొందండి.',
  feature_deadline: 'గడువు కౌంట్‌డౌన్',
  feature_deadline_desc: 'దరఖాస్తు గడువులు మూల పేజీ ఉదాహరణలతో.',
  feature_steps: 'దశల వారీ ప్రణాళిక',
  feature_steps_desc: 'ప్రభుత్వ పోర్టల్ లింక్‌లతో క్రమ సంఖ్య ప్రణాళిక.',
  feature_voice: 'వాయిస్ ఫస్ట్',
  feature_voice_desc: 'మీ మాతృభాషలో ప్రశ్నలు అడగండి. TTS తో సమాధానాలు వినండి.',
  feature_evidence: 'ఆధార ఆధారిత',
  feature_evidence_desc: 'ప్రతి వాదన సరైన పత్రం పేరు మరియు పేజీ నంబరును ఉదహరిస్తుంది.',
  how_title: 'ఇది ఎలా పనిచేస్తుంది',
  how_subtitle: 'మూడు దశల్లో మీ సమాధానం పొందండి',
  how_step1_title: 'మీ PDF అప్‌లోడ్ చేయండి',
  how_step1_desc: 'ఏదైనా ప్రభుత్వ పథకం నోటిఫికేషన్ అప్‌లోడ్ చేయండి. 25 MB వరకు.',
  how_step2_title: 'మీ భాషలో అడగండి',
  how_step2_desc: 'తెలుగు, ఆంగ్లం, హిందీ లేదా 13 భారతీయ భాషల్లో టైప్ చేయండి లేదా మాట్లాడండి.',
  how_step3_title: 'మీ ప్రణాళిక పొందండి',
  how_step3_desc: 'అర్హత స్థితి, పత్ర చెక్‌లిస్ట్, గడువు మరియు దశల వారీ ప్రణాళికతో సమాధానం పొందండి.',
  lang_section_badge: '13+ భాషలు మద్దతు',
  lang_section_title: 'మీ భాష, మీ హక్కులు',
  lang_section_desc: 'BharatSahay AI ప్రతి భారతీయ పౌరుడి భాషను మాట్లాడుతుంది.',
  cta_title: 'మీ హక్కులు తెలుసుకోవడానికి సిద్ధమా?',
  cta_desc: 'వేలాది భారతీయ పౌరులతో చేరండి.',
  cta_btn: 'ఉచితంగా ప్రారంభించండి',
  footer: '© 2026 BharatSahay AI · ❤️ తో భారత్ కోసం',

  auth_back: 'హోమ్‌కి తిరిగి',
  auth_subtitle: 'బహుభాష ప్రభుత్వ AI',
  auth_sign_in: 'సైన్ ఇన్',
  auth_register: 'రిజిస్టర్',
  auth_full_name: 'పూర్తి పేరు',
  auth_name_placeholder: 'రమేష్ కుమార్',
  auth_email: 'ఇమెయిల్',
  auth_password: 'పాస్‌వర్డ్',
  auth_pref_language: 'ఇష్టమైన భాష',
  auth_signing_in: 'సైన్ ఇన్ అవుతోంది…',
  auth_creating: 'ఖాతా సృష్టించబడుతోంది…',
  auth_create_account: 'ఖాతా సృష్టించు',
  auth_no_account: 'ఖాతా లేదా?',
  auth_have_account: 'ఇప్పటికే ఖాతా ఉందా?',
  auth_i_am: 'నేను…',
  auth_role_student_desc: 'స్కాలర్‌షిప్‌లు & విద్య',
  auth_role_citizen_desc: 'పథకాలు & ప్రజా సేవలు',
  auth_role_farmer_desc: 'వ్యవసాయం & సబ్సిడీలు',
  auth_role_business_desc: 'లైసెన్స్‌లు & అనుగుణ్యత',

  prof_title: 'నా ప్రొఫైల్',
  prof_subtitle: 'మీ పాత్ర ఆధారిత ప్రొఫైల్ పథకాలు, అర్హతలు మరియు సూచనలను మీ కోసం అనుకూలీకరిస్తుంది.',
  prof_role_student: 'విద్యార్థి',
  prof_role_citizen: 'పౌరుడు',
  prof_role_farmer: 'రైతు',
  prof_role_business: 'వ్యాపారి',
  prof_account_details: 'ఖాతా వివరాలు',
  prof_member_since: 'సభ్యత నుండి',
  prof_pref_language: 'ఇష్ట భాష',
  prof_save: 'ప్రొఫైల్ సేవ్ చేయి',
  prof_saved: 'ప్రొఫైల్ సేవ్ అయింది',
  prof_continue: 'డాష్‌బోర్డ్‌కి కొనสాగించు',
  prof_name: 'పేరు',
  prof_email: 'ఇమెయిల్',
  prof_back: 'వెనుకకు',
  prof_saving: 'సేవ్ చేస్తోంది…',
  prof_lang_hint: 'సమాధానాలు, వాయిస్ మరియు మొత్తం ఇంటర్‌ఫేస్‌కి ఉపయోగపడుతుంది',
  prof_details_fmt: 'వివరాలు',
  prof_eg: 'ఉదా:',
  prof_select: 'ఎంచుకోండి',
  prof_edit: 'ప్రొఫైల్‌ను సవరించండి',
  prof_cancel: 'రద్దు చేయి',
  prof_no_data: 'ఇంకా ఏమీ నింపబడలేదు — వివరాలు జోడించడానికి ప్రొఫైల్‌ను సవరించండి.',
  prof_not_set: 'సెట్ చేయలేదు',
  fld_education_level: 'విద్యా స్థాయి',
  fld_institution: 'పాఠశాల / కళాశాల',
  fld_state: 'రాష్ట్రం',
  fld_annual_income: 'వార్షిక ఆదాయం',
  fld_category: 'వర్గం',
  fld_interests: 'ఆసక్తి రంగాలు',
  fld_city: 'నగరం / జిల్లా',
  fld_age_group: 'వయసు వర్గం',
  fld_occupation: 'వృత్తి',
  fld_district: 'జిల్లా',
  fld_land_size: 'భూమి పరిమాణం',
  fld_crops: 'ముఖ్య పంటలు',
  fld_irrigation: 'నీటి వసతి',
  fld_business_name: 'వ్యాపార పేరు',
  fld_business_type: 'వ్యాపార రకం',
  fld_employees: 'ఉద్యోగులు',
  fld_annual_turnover: 'వార్షిక ఆదాయం (వ్యాపారం)',
  fld_gst_registered: 'GST నమోదు?',

  dash_welcome: 'మళ్ళీ స్వాగతం,',
  dash_upload_hint: 'ప్రభుత్వ పథకం PDF అప్‌లోడ్ చేసి ప్రశ్నలు అడగండి',
  dash_documents: 'పత్రాలు',
  dash_ready: 'సిద్ధం',
  dash_conversations: 'సంభాషణలు',
  dash_language: 'భాష',
  dash_drop_pdf: 'ఇక్కడ PDF డ్రాప్ చేయండి లేదా',
  dash_drop_hint: 'ప్రభుత్వ పథకాలు, స్కాలర్‌షిప్‌లు · గరిష్టంగా 25 MB',
  dash_click_upload: 'అప్‌లోడ్ చేయడానికి క్లిక్ చేయండి',
  dash_upload_hint2: 'PDF లేదా చిత్రం (PNG, JPG) · ప్రభుత్వ పథకాలు, స్కాలర్‌షిప్‌లు, నోటీసులు · గరిష్టంగా 25 MB',
  dash_uploading: 'PDF అప్‌లోడ్ అవుతోంది…',
  dash_general_chat: 'సాధారణ చాట్',
  dash_general_chat_hint: 'పత్రం లేకుండా ప్రశ్నలు అడగండి',
  dash_no_docs: 'పత్రాలు లేవు. PDF అప్‌లోడ్ చేయండి.',
  dash_no_convs: 'సంభాషణలు లేవు. చాట్ ప్రారంభించండి!',
  dash_chat: 'చాట్',
  dash_loading: 'లోడ్ అవుతోంది…',
  dash_status_ready: 'సిద్ధం',
  dash_status_processing: 'ప్రాసెసింగ్…',
  dash_status_pending: 'పెండింగ్',
  dash_status_failed: 'విఫలం',

  chat_header: 'BharatSahay AI',
  chat_general: 'సాధారణ విచారణ',
  chat_ask_title: 'BharatSahay AI ని అడగండి',
  chat_ask_with_doc: '"{filename}" గురించి పత్రం నుండి ఆధారంతో సమాధానం ఇస్తాను.',
  chat_ask_without_doc: 'ఏదైనా ప్రభుత్వ పథకం, అర్హత లేదా దరఖాస్తు ప్రక్రియ గురించి అడగండి.',
  chat_input_placeholder: '{lang} లో అడగండి… (పంపడానికి Enter)',
  chat_stop_speaking: 'మాట్లాడడం ఆపు',
  chat_voice_input: 'వాయిస్ ఇన్‌పుట్',
  chat_stop_recording: 'రికార్డింగ్ ఆపు',
  chat_read_aloud: 'బిగ్గరగా చదువు',
  chat_insights: 'అంతర్దృష్టులు',
  chat_helpful: 'సహాయకరం',
  chat_not_helpful: 'సహాయకరం కాదు',
  chat_loading_conv: 'సంభాషణ లోడ్ అవుతోంది…',
  chat_footer_note: 'పత్రం నుండి ఆధార సమాధానాలు · అధికారిక అథారిటీతో ధృవీకరించండి',
  chat_verify: 'అధికారిక అథారిటీతో ధృవీకరించండి',
  chat_confidence: '% విశ్వాసం',
  chat_eligibility: 'అర్హత',
  chat_conditions_met: '✓ షరతులు పూర్తి',
  chat_conditions_unmet: '✗ షరతులు పూర్తి కాలేదు',
  chat_missing_info: '? సమాచారం లేదు',
  chat_status_eligible: 'అర్హులు',
  chat_status_not_eligible: 'అర్హత లేదు',
  chat_status_uncertain: 'అనిశ్చితం',
  chat_source_page: 'మూలం: పేజీ {page}',
  chat_open_source: 'అసలు పత్రాన్ని పేజీ {page} వద్ద తెరవండి',
  chat_deadline: 'గడువు',
  chat_required_docs: 'అవసరమైన పత్రాలు',
  chat_action_plan: 'చర్య ప్రణాళిక',
  chat_sources: 'మూలాలు',

  suggest_eligible: 'నేను ఈ పథకానికి అర్హుడినా?',
  suggest_documents: 'నాకు ఏ పత్రాలు కావాలి?',
  suggest_deadline: 'దరఖాస్తు గడువు ఏమిటి?',
  suggest_how_apply: 'దశల వారీగా ఎలా దరఖాస్తు చేయాలి?',
  suggest_income_limit: 'ఆదాయ పరిమితి ఏమిటి?',
};

const kn: Translations = {
  ...en,
  nav_features: 'ವೈಶಿಷ್ಟ್ಯಗಳು',
  nav_languages: 'ಭಾಷೆಗಳು',
  nav_how: 'ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
  nav_get_started: 'ಪ್ರಾರಂಭಿಸಿ',
  hero_subtitle_1: 'ನಿಮ್ಮ ಸರ್ಕಾರಿ AI',
  hero_subtitle_2: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ',
  hero_start_free: 'ಉಚಿತವಾಗಿ ಪ್ರಾರಂಭಿಸಿ',
  hero_voice_demo: 'ವಾಯ್ಸ್ ಡೆಮೋ ಪ್ರಯತ್ನಿಸಿ',
  auth_back: 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ',
  auth_sign_in: 'ಸೈನ್ ಇನ್',
  auth_register: 'ನೋಂದಣಿ',
  auth_full_name: 'ಪೂರ್ಣ ಹೆಸರು',
  auth_email: 'ಇಮೇಲ್',
  auth_password: 'ಪಾಸ್‌ವರ್ಡ್',
  auth_pref_language: 'ಆದ್ಯತೆಯ ಭಾಷೆ',
  auth_create_account: 'ಖಾತೆ ರಚಿಸಿ',
  dash_welcome: 'ಮತ್ತೆ ಸ್ವಾಗತ,',
  dash_documents: 'ದಾಖಲೆಗಳು',
  dash_conversations: 'ಸಂಭಾಷಣೆಗಳು',
  dash_general_chat: 'ಸಾಮಾನ್ಯ ಚಾಟ್',
  dash_chat: 'ಚಾಟ್',
  chat_ask_title: 'BharatSahay AI ಅನ್ನು ಕೇಳಿ',
  chat_insights: 'ಒಳನೋಟಗಳು',
  suggest_eligible: 'ನಾನು ಈ ಯೋಜನೆಗೆ ಅರ್ಹನಾ?',
  suggest_documents: 'ನನಗೆ ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?',
  suggest_deadline: 'ಅರ್ಜಿ ಕೊನೆ ದಿನಾಂಕ ಏನು?',
  suggest_how_apply: 'ಹಂತ ಹಂತವಾಗಿ ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು?',
  suggest_income_limit: 'ಆದಾಯ ಮಿತಿ ಎಷ್ಟು?',
};

const ml: Translations = {
  ...en,
  nav_features: 'സവിശേഷതകൾ',
  nav_languages: 'ഭാഷകൾ',
  nav_how: 'എങ്ങനെ പ്രവർത്തിക്കുന്നു',
  nav_get_started: 'ആരംഭിക്കുക',
  hero_subtitle_1: 'നിങ്ങളുടെ സർക്കാർ AI',
  hero_subtitle_2: 'നിങ്ങളുടെ ഭാഷയിൽ',
  hero_start_free: 'സൗജന്യമായി ആരംഭിക്കുക',
  auth_back: 'ഹോമിലേക്ക് മടങ്ങുക',
  auth_sign_in: 'സൈൻ ഇൻ',
  auth_register: 'രജിസ്റ്റർ',
  auth_full_name: 'പൂർണ്ണ നാമം',
  auth_email: 'ഇമെയിൽ',
  auth_password: 'പാസ്‌വേഡ്',
  auth_create_account: 'അക്കൗണ്ട് സൃഷ്ടിക്കുക',
  dash_welcome: 'തിരികെ സ്വാഗതം,',
  dash_documents: 'രേഖകൾ',
  dash_conversations: 'സംഭാഷണങ്ങൾ',
  dash_general_chat: 'പൊതു ചാറ്റ്',
  dash_chat: 'ചാറ്റ്',
  chat_ask_title: 'BharatSahay AI-യോട് ചോദിക്കൂ',
  chat_insights: 'ഉൾക്കാഴ്ചകൾ',
  suggest_eligible: 'ഈ പദ്ധതിക്ക് ഞാൻ യോഗ്യനാണോ?',
  suggest_documents: 'എനിക്ക് എന്തൊക്കെ രേഖകൾ വേണം?',
  suggest_deadline: 'അപേക്ഷയുടെ അവസാന തീയതി എന്താണ്?',
  suggest_how_apply: 'ഘട്ടംഘട്ടമായി എങ്ങനെ അപേക്ഷിക്കാം?',
  suggest_income_limit: 'വരുമാന പരിധി എത്രയാണ്?',
};

const bn: Translations = {
  ...en,
  nav_features: 'বৈশিষ্ট্য',
  nav_languages: 'ভাষা',
  nav_how: 'কিভাবে কাজ করে',
  nav_get_started: 'শুরু করুন',
  hero_subtitle_1: 'আপনার সরকারি AI',
  hero_subtitle_2: 'আপনার ভাষায়',
  hero_start_free: 'বিনামূল্যে শুরু করুন',
  auth_back: 'হোমে ফিরে যান',
  auth_sign_in: 'সাইন ইন',
  auth_register: 'নিবন্ধন',
  auth_full_name: 'পূর্ণ নাম',
  auth_email: 'ইমেইল',
  auth_password: 'পাসওয়ার্ড',
  auth_create_account: 'অ্যাকাউন্ট তৈরি করুন',
  dash_welcome: 'আবার স্বাগতম,',
  dash_documents: 'নথি',
  dash_conversations: 'কথোপকথন',
  dash_general_chat: 'সাধারণ চ্যাট',
  dash_chat: 'চ্যাট',
  chat_ask_title: 'BharatSahay AI কে জিজ্ঞাসা করুন',
  chat_insights: 'অন্তর্দৃষ্টি',
  suggest_eligible: 'আমি কি এই প্রকল্পের জন্য যোগ্য?',
  suggest_documents: 'আমার কি কি নথি দরকার?',
  suggest_deadline: 'আবেদনের শেষ তারিখ কী?',
  suggest_how_apply: 'ধাপে ধাপে কিভাবে আবেদন করব?',
  suggest_income_limit: 'আয়ের সীমা কত?',
};

const mr: Translations = {
  ...en,
  nav_features: 'वैशिष्ट्ये',
  nav_languages: 'भाषा',
  nav_how: 'कसे काम करते',
  nav_get_started: 'सुरू करा',
  hero_subtitle_1: 'तुमचे सरकारी AI',
  hero_subtitle_2: 'तुमच्या भाषेत',
  hero_start_free: 'मोफत सुरू करा',
  auth_back: 'मुख्यपृष्ठावर परत',
  auth_sign_in: 'साइन इन',
  auth_register: 'नोंदणी',
  auth_full_name: 'पूर्ण नाव',
  auth_email: 'ईमेल',
  auth_password: 'पासवर्ड',
  auth_create_account: 'खाते तयार करा',
  dash_welcome: 'पुन्हा स्वागत,',
  dash_documents: 'कागदपत्रे',
  dash_conversations: 'संवाद',
  dash_general_chat: 'सामान्य चॅट',
  dash_chat: 'चॅट',
  chat_ask_title: 'BharatSahay AI ला विचारा',
  chat_insights: 'माहिती',
  suggest_eligible: 'मी या योजनेसाठी पात्र आहे का?',
  suggest_documents: 'मला कोणती कागदपत्रे लागतात?',
  suggest_deadline: 'अर्जाची शेवटची तारीख काय आहे?',
  suggest_how_apply: 'चरणबद्ध कसे अर्ज करावे?',
  suggest_income_limit: 'उत्पन्न मर्यादा किती आहे?',
};

const gu: Translations = {
  ...en,
  nav_features: 'વિશેષતાઓ',
  nav_languages: 'ભાષાઓ',
  nav_how: 'કેવી રીતે કામ કરે છે',
  nav_get_started: 'શરૂ કરો',
  hero_subtitle_1: 'તમારી સરકારી AI',
  hero_subtitle_2: 'તમારી ભાષામાં',
  hero_start_free: 'મફતમાં શરૂ કરો',
  auth_back: 'હોમ પર પાછા',
  auth_sign_in: 'સાઇન ઇન',
  auth_register: 'નોંધણી',
  auth_full_name: 'પૂરું નામ',
  auth_email: 'ઇમેઇલ',
  auth_password: 'પાસવર્ડ',
  auth_create_account: 'ખાતું બનાવો',
  dash_welcome: 'ફરી આવકાર,',
  dash_documents: 'દસ્તાવેજો',
  dash_conversations: 'વાતચીત',
  dash_general_chat: 'સામાન્ય ચેટ',
  dash_chat: 'ચેટ',
  chat_ask_title: 'BharatSahay AI ને પૂછો',
  chat_insights: 'આંતરદૃષ્ટિ',
  suggest_eligible: 'શું હું આ યોજના માટે પાત્ર છું?',
  suggest_documents: 'મને કયા દસ્તાવેજો જોઈએ?',
  suggest_deadline: 'અરજીની છેલ્લી તારીખ શું છે?',
  suggest_how_apply: 'પગલે પગલે કેવી રીતે અરજી કરવી?',
  suggest_income_limit: 'આવક મર્યાદા કેટલી છે?',
};

const pa: Translations = {
  ...en,
  nav_features: 'ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ',
  nav_languages: 'ਭਾਸ਼ਾਵਾਂ',
  nav_how: 'ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
  nav_get_started: 'ਸ਼ੁਰੂ ਕਰੋ',
  hero_subtitle_1: 'ਤੁਹਾਡੀ ਸਰਕਾਰੀ AI',
  hero_subtitle_2: 'ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ',
  hero_start_free: 'ਮੁਫ਼ਤ ਸ਼ੁਰੂ ਕਰੋ',
  auth_back: 'ਹੋਮ ਤੇ ਵਾਪਸ',
  auth_sign_in: 'ਸਾਈਨ ਇਨ',
  auth_register: 'ਰਜਿਸਟਰ',
  auth_full_name: 'ਪੂਰਾ ਨਾਮ',
  auth_email: 'ਈਮੇਲ',
  auth_password: 'ਪਾਸਵਰਡ',
  auth_create_account: 'ਖਾਤਾ ਬਣਾਓ',
  dash_welcome: 'ਮੁੜ ਸਵਾਗਤ ਹੈ,',
  dash_documents: 'ਦਸਤਾਵੇਜ਼',
  dash_conversations: 'ਗੱਲਬਾਤ',
  dash_general_chat: 'ਸਾਧਾਰਨ ਚੈਟ',
  dash_chat: 'ਚੈਟ',
  chat_ask_title: 'BharatSahay AI ਨੂੰ ਪੁੱਛੋ',
  chat_insights: 'ਸੂਝ',
  suggest_eligible: 'ਕੀ ਮੈਂ ਇਸ ਯੋਜਨਾ ਲਈ ਯੋਗ ਹਾਂ?',
  suggest_documents: 'ਮੈਨੂੰ ਕਿਹੜੇ ਦਸਤਾਵੇਜ਼ ਚਾਹੀਦੇ ਹਨ?',
  suggest_deadline: 'ਅਰਜ਼ੀ ਦੀ ਆਖ਼ਰੀ ਤਾਰੀਖ਼ ਕੀ ਹੈ?',
  suggest_how_apply: 'ਕਦਮ ਦਰ ਕਦਮ ਕਿਵੇਂ ਅਰਜ਼ੀ ਦੇਣੀ ਹੈ?',
  suggest_income_limit: 'ਆਮਦਨ ਸੀਮਾ ਕਿੰਨੀ ਹੈ?',
};

const ur: Translations = {
  ...en,
  nav_features: 'خصوصیات',
  nav_languages: 'زبانیں',
  nav_how: 'کیسے کام کرتا ہے',
  nav_get_started: 'شروع کریں',
  hero_subtitle_1: 'آپ کی سرکاری AI',
  hero_subtitle_2: 'آپ کی زبان میں',
  hero_start_free: 'مفت شروع کریں',
  auth_back: 'ہوم پر واپس',
  auth_sign_in: 'سائن ان',
  auth_register: 'رجسٹر',
  auth_full_name: 'پورا نام',
  auth_email: 'ای میل',
  auth_password: 'پاسورڈ',
  auth_create_account: 'اکاؤنٹ بنائیں',
  dash_welcome: 'واپسی پر خوش آمدید،',
  dash_documents: 'دستاویزات',
  dash_conversations: 'بات چیت',
  dash_general_chat: 'عمومی چیٹ',
  dash_chat: 'چیٹ',
  chat_ask_title: 'BharatSahay AI سے پوچھیں',
  chat_insights: 'بصیرت',
  suggest_eligible: 'کیا میں اس اسکیم کے لیے اہل ہوں؟',
  suggest_documents: 'مجھے کون سی دستاویزات چاہیئیں؟',
  suggest_deadline: 'درخواست کی آخری تاریخ کیا ہے؟',
  suggest_how_apply: 'قدم بہ قدم درخواست کیسے دیں؟',
  suggest_income_limit: 'آمدنی کی حد کتنی ہے؟',
};

const or_: Translations = {
  ...en,
  nav_features: 'ବୈଶିଷ୍ଟ୍ୟ',
  nav_languages: 'ଭାଷା',
  nav_how: 'କିପରି କାମ କରେ',
  nav_get_started: 'ଆରମ୍ଭ କରନ୍ତୁ',
  hero_subtitle_1: 'ଆପଣଙ୍କ ସରକାରୀ AI',
  hero_subtitle_2: 'ଆପଣଙ୍କ ଭାଷାରେ',
  hero_start_free: 'ମାଗଣାରେ ଆରମ୍ଭ କରନ୍ତୁ',
  auth_sign_in: 'ସାଇନ ଇନ',
  auth_register: 'ପଞ୍ଜୀକରଣ',
  auth_create_account: 'ଖାତା ସୃଷ୍ଟି କରନ୍ତୁ',
  dash_welcome: 'ପୁଣି ସ୍ୱାଗତ,',
  dash_documents: 'ଦଲିଲ',
  dash_conversations: 'ସଂଭାଷଣ',
  dash_chat: 'ଚାଟ',
  chat_ask_title: 'BharatSahay AI ଙ୍କୁ ପଚାରନ୍ତୁ',
  suggest_eligible: 'ମୁଁ ଏହି ଯୋଜନା ପାଇଁ ଯୋଗ୍ୟ କି?',
  suggest_documents: 'ମୋତେ କ\'ଣ ଦଲିଲ ଦରକାର?',
  suggest_deadline: 'ଆବେଦନର ଶେଷ ତାରିଖ କ\'ଣ?',
  suggest_how_apply: 'ପାହାଚରେ କିପରି ଆବେଦନ କରିବି?',
  suggest_income_limit: 'ଆୟ ସୀମା କେତେ?',
};

const as_: Translations = {
  ...en,
  nav_features: 'বৈশিষ্ট্যসমূহ',
  nav_languages: 'ভাষাসমূহ',
  nav_how: 'কেনেকৈ কাম কৰে',
  nav_get_started: 'আৰম্ভ কৰক',
  hero_subtitle_1: 'আপোনাৰ চৰকাৰী AI',
  hero_subtitle_2: 'আপোনাৰ ভাষাত',
  hero_start_free: 'বিনামূলীয়াকৈ আৰম্ভ কৰক',
  auth_sign_in: 'ছাইন ইন',
  auth_register: 'পঞ্জীয়ন',
  auth_create_account: 'একাউণ্ট সৃষ্টি কৰক',
  dash_welcome: 'পুনৰ স্বাগতম,',
  dash_documents: 'নথি',
  dash_conversations: 'কথোপকথন',
  dash_chat: 'চেট',
  chat_ask_title: 'BharatSahay AI ক সোধক',
  suggest_eligible: 'মই এই আঁচনিৰ বাবে যোগ্য নে?',
  suggest_documents: 'মোক কি কি নথি লাগিব?',
  suggest_deadline: 'আবেদনৰ শেষ তাৰিখ কি?',
  suggest_how_apply: 'পদক্ষেপে পদক্ষেপে কেনেকৈ আবেদন কৰিম?',
  suggest_income_limit: 'আয় সীমা কিমান?',
};

// ─── Translation Map ─────────────────────────────────────────────────────────
const TRANSLATIONS: Record<string, Translations> = {
  en, hi, ta, te, kn, ml, bn, mr, gu, pa, ur,
  or: or_,
  as: as_,
};

/**
 * Get the full translations object for a language code.
 * Falls back to English if the language is not supported.
 */
export function getTranslations(lang: string): Translations {
  return TRANSLATIONS[lang] || en;
}

/**
 * Convenience: Get a single translated string.
 */
export function t(lang: string, key: keyof Translations): string {
  const dict = TRANSLATIONS[lang] || en;
  return dict[key] || en[key];
}

/**
 * Template-replace {placeholder} values in translated strings.
 */
export function tFmt(lang: string, key: keyof Translations, vars: Record<string, string>): string {
  let str = t(lang, key);
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, v);
  }
  return str;
}
