// Translated dropdown options for role-based profile fields.
// `value` is what gets stored in the DB (canonical English); `label` is
// what the user sees per language. Languages without an entry fall back to English.

export interface ProfileOption {
  value: string;
  label: Record<string, string>;
}

const L = (en: string, hi: string, ta: string, te: string): Record<string, string> => ({ en, hi, ta, te });

export const PROFILE_OPTIONS = {
  education_level: [
    { value: 'Class 10', label: L('Class 10', 'कक्षा 10', '10 வகுப்பு', '10వ తరగతి') },
    { value: 'Class 12', label: L('Class 12', 'कक्षा 12', '12 வகுப்பு', '12వ తరగతి') },
    { value: 'Diploma', label: L('Diploma', 'डिप्लोमा', 'டிப்ளமோ', 'డిప్లమా') },
    { value: 'UG', label: L('Undergraduate (UG)', 'स्नातक (UG)', 'இளநிலை (UG)', 'డిగ్రీ (UG)') },
    { value: 'PG', label: L('Postgraduate (PG)', 'परास्त (PG)', 'முதுநிலை (PG)', 'పోస్ట్ గ్రాడ్యుయేట్ (PG)') },
    { value: 'Other', label: L('Other', 'अन्य', 'மற்றவை', 'ఇతర') },
  ],
  category: [
    { value: 'General', label: L('General', 'सामान्य', 'பொது', 'సాధారణ') },
    { value: 'OBC', label: L('OBC', 'ओबीसी', 'ஓபிசி (OBC)', 'ఓబీసీ (OBC)') },
    { value: 'BC', label: L('BC', 'बीसी', 'பிற்படுத்தப்பட்டோர் (BC)', 'బీసీ (BC)') },
    { value: 'MBC', label: L('MBC', 'एमबीसी', 'மிகவும் பிற்படுத்தப்பட்டோர் (MBC)', 'ఎంబీసీ (MBC)') },
    { value: 'SC', label: L('SC', 'एससी', 'எஸ்சி (SC)', 'ఎస్సీ (SC)') },
    { value: 'ST', label: L('ST', 'एसटी', 'எஸ்டி (ST)', 'ఎస్టీ (ST)') },
    { value: 'EWS', label: L('EWS', 'ईडब्ल्यूएस', 'ஈடபு (EWS)', 'ఈడబ్ల్యూఎస్ (EWS)') },
    { value: 'Other', label: L('Other', 'अन्य', 'மற்றவை', 'ఇతర') },
  ],
  interests: [
    { value: 'Engineering', label: L('Engineering', 'इंजीनियरिंग', 'பொறியியல்', 'ఇంజనీరింగ్') },
    { value: 'Medicine', label: L('Medicine', 'चिकित्सा', 'மருத்துவம்', 'వైద్యం') },
    { value: 'Law', label: L('Law', 'कानून', 'சட்டம்', 'న్యాయశాస్త్రం') },
    { value: 'Commerce', label: L('Commerce', 'वाणिज्य', 'வணிகவியல்', 'వాణిజ్యం') },
    { value: 'Arts', label: L('Arts', 'कला', 'கலை', 'కళలు') },
    { value: 'Science', label: L('Science', 'विज्ञान', 'அறிவியல்', 'విజ్ఞానం') },
    { value: 'Agriculture', label: L('Agriculture', 'कृषि', 'விவசாயம்', 'వ్యవసాయం') },
    { value: 'Teaching', label: L('Teaching', 'शिक्षण', 'ஆசிரியர் பணி', 'ఉపాధ్యాయ వృత్తి') },
    { value: 'Other', label: L('Other', 'अन्य', 'மற்றவை', 'ఇతర') },
  ],
  state: [
    { value: 'Andhra Pradesh', label: L('Andhra Pradesh', 'आंध्र प्रदेश', 'ஆந்திரப் பிரதேசம்', 'ఆంధ్రప్రదేశ్') },
    { value: 'Assam', label: L('Assam', 'असम', 'அசாம்', 'అస్సాం') },
    { value: 'Bihar', label: L('Bihar', 'बिहार', 'பீகார்', 'బీహార్') },
    { value: 'Chhattisgarh', label: L('Chhattisgarh', 'छत्तीसगढ़', 'சத்தீஸ்கர்', 'ఛత్తీస్‌ఘర్') },
    { value: 'Delhi', label: L('Delhi', 'दिल्ली', 'தில்லி', 'ఢిల్లీ') },
    { value: 'Goa', label: L('Goa', 'गोवा', 'கோவா', 'గోవా') },
    { value: 'Gujarat', label: L('Gujarat', 'गुजरात', 'குஜராத்', 'గుజరాత్') },
    { value: 'Haryana', label: L('Haryana', 'हरियाणा', 'ஹரியானா', 'హర్యానా') },
    { value: 'Himachal Pradesh', label: L('Himachal Pradesh', 'हिमाचल प्रदेश', 'இமாச்சலப் பிரதேசம்', 'హిమాచల్ ప్రదేశ్') },
    { value: 'Jharkhand', label: L('Jharkhand', 'झारखंड', 'ஜார்க்கண்ட்', 'ఝార్ఖండ్') },
    { value: 'Karnataka', label: L('Karnataka', 'कर्नाटक', 'கர்நாடகா', 'కర్ణాటక') },
    { value: 'Kerala', label: L('Kerala', 'केरल', 'கேரளா', 'కేరళ') },
    { value: 'Madhya Pradesh', label: L('Madhya Pradesh', 'मध्य प्रदेश', 'மத்தியப் பிரதேசம்', 'మధ్యప్రదేశ్') },
    { value: 'Maharashtra', label: L('Maharashtra', 'महाराष्ट्र', 'மகாராஷ்டிரா', 'మహారాష్ట్ర') },
    { value: 'Odisha', label: L('Odisha', 'ओडिशा', 'ஒடிசா', 'ఒడిశా') },
    { value: 'Punjab', label: L('Punjab', 'पंजाब', 'பஞ்சாப்', 'పంజాబ్') },
    { value: 'Rajasthan', label: L('Rajasthan', 'राजस्थान', 'ராஜஸ்தான்', 'రాజస్థాన్') },
    { value: 'Tamil Nadu', label: L('Tamil Nadu', 'तमिलनाडु', 'தமிழ்நாடு', 'తమిళనాడు') },
    { value: 'Telangana', label: L('Telangana', 'तेलंगाना', 'தெலங்கானா', 'తెలంగాణ') },
    { value: 'Uttar Pradesh', label: L('Uttar Pradesh', 'उत्तर प्रदेश', 'உத்தரப் பிரதேசம்', 'ఉత్తరప్రదేశ్') },
    { value: 'Uttarakhand', label: L('Uttarakhand', 'उत्तराखंड', 'உத்தரகண்ட்', 'ఉత్తరాఖండ్') },
    { value: 'West Bengal', label: L('West Bengal', 'पश्चिम बंगाल', 'மேற்கு வங்காளம்', 'పశ్చిమ బెంగాల్') },
    { value: 'Jammu & Kashmir', label: L('Jammu & Kashmir', 'जम्मू और कश्मीर', 'ஜம்மு காஷ்மீர்', 'జమ్మూ కాశ్మీర్') },
    { value: 'Puducherry', label: L('Puducherry', 'पुदुचेरी', 'புதுச்சேரி', 'పుదుచ్చేరి') },
    { value: 'Other', label: L('Other', 'अन्य', 'மற்றவை', 'ఇతర') },
  ],
} as const;

export type ProfileOptionField = keyof typeof PROFILE_OPTIONS;

/** Label for a stored value in the user's language (falls back to English, then the raw value). */
export function optionLabel(field: ProfileOptionField, value: string, lang: string): string {
  const opt = (PROFILE_OPTIONS[field] as readonly ProfileOption[]).find(o => o.value === value);
  if (!opt) return value;
  return opt.label[lang] || opt.label.en || value;
}

/** Canonicalize a previously saved free-text value to a dropdown value when it matches case-insensitively. */
export function normalizeOptionValue(field: ProfileOptionField, value: string | undefined): string {
  if (!value) return '';
  const opts = PROFILE_OPTIONS[field] as readonly ProfileOption[];
  const hit = opts.find(o => o.value.toLowerCase() === value.trim().toLowerCase());
  return hit ? hit.value : value.trim();
}
