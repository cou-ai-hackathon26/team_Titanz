import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { goBack } from '../lib/nav';
import SetupLayout from '../components/SetupLayout';
import Input from '../components/Input';
import ChoiceGroup from '../components/ChoiceGroup';
import Button from '../components/Button';
import { loadProfile, saveProfile, Profile } from '../lib/storage';
import { onlyDigits, toBanglaDigits } from '../lib/bangla';

// Screen 00g · About you (setup step 1 of 2): name, age, gender, diabetes type, treatment.
// Saved only on the phone. These answers are used later by the risk check.
// Opened from Settings with ?edit=1: saving goes back to Settings instead of the next setup step.
export default function AboutYouScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = edit === '1';
  const [name, setName] = useState('');
  const [ageDigits, setAgeDigits] = useState(''); // English digits, e.g. "58"
  const [gender, setGender] = useState<Profile['gender']>(null);
  const [diabetesType, setDiabetesType] = useState<Profile['diabetesType']>(null);
  const [treatment, setTreatment] = useState<Profile['treatment']>(null);

  // Fill in anything the user already saved (e.g. when they come back to this screen).
  useEffect(() => {
    loadProfile().then((p) => {
      setName(p.name);
      setAgeDigits(p.age ? String(p.age) : '');
      setGender(p.gender);
      setDiabetesType(p.diabetesType);
      setTreatment(p.treatment);
    });
  }, []);

  const age = Number(ageDigits);
  const ageOk = ageDigits !== '' && age >= 1 && age <= 120;
  const canContinue = name.trim() !== '' && ageOk && !!gender && !!diabetesType && !!treatment;

  // Save the answers and go to step 2.
  async function next() {
    await saveProfile({ name: name.trim(), age, gender, diabetesType, treatment });
    if (editing) goBack('/settings');
    else router.push('/iftar');
  }

  return (
    <SetupLayout
      backTo={editing ? '/settings' : '/guide/3'}
      step={1}
      totalSteps={2}
      title="আপনার সম্পর্কে বলুন"
      subtitle="এতে আপনার ঝুঁকি ঠিকভাবে বোঝা যাবে"
      bottom={
        <Button label={editing ? 'সেভ করুন' : 'পরবর্তী'} sub={editing ? 'Save' : 'Next'} onPress={next} disabled={!canContinue} />
      }
    >
      <Input label="আপনার নাম" value={name} onChangeText={setName} placeholder="যেমন: রহিম উদ্দিন" maxLength={40} />
      <Input
        label="বয়স"
        value={toBanglaDigits(ageDigits)}
        onChangeText={(t) => setAgeDigits(onlyDigits(t).slice(0, 3))}
        placeholder="৫৮"
        suffixText="বছর"
        digitsOnly
        keyboardType="number-pad"
        maxLength={3}
      />
      <ChoiceGroup
        label="লিঙ্গ"
        value={gender}
        onChange={setGender}
        options={[
          { value: 'male', label: 'পুরুষ' },
          { value: 'female', label: 'নারী' },
        ]}
      />
      <ChoiceGroup
        label="ডায়াবেটিসের ধরন"
        value={diabetesType}
        onChange={setDiabetesType}
        options={[
          { value: 'type2', label: 'টাইপ ২' },
          { value: 'type1', label: 'টাইপ ১' },
          { value: 'unknown', label: 'জানি না' },
        ]}
      />
      <ChoiceGroup
        label="কীভাবে নিয়ন্ত্রণ করেন?"
        value={treatment}
        onChange={setTreatment}
        options={[
          { value: 'diet', label: 'খাবার নিয়ন্ত্রণ' },
          { value: 'tablets', label: 'ট্যাবলেট' },
          { value: 'insulin', label: 'ইনসুলিন' },
        ]}
      />
    </SetupLayout>
  );
}
