import { type FormEvent, useState } from 'react';

import { AvatarDesignSection } from '@/components/step3/AvatarDesignSection';
import { BackgroundImageDesignSection } from '@/components/step3/BackgroundImageDesignSection';
import { IntroCopySection } from '@/components/step3/IntroCopySection';
import { NicknameRecommendSection } from '@/components/step3/NicknameRecommendSection';
import { OverallStrategySection } from '@/components/step3/OverallStrategySection';
import { Step3Form } from '@/components/step3/Step3Form';
import { Step3PageHeader, Step3SectionDivider } from '@/components/step3/Step3PageHeader';
import { VideoReferenceCaseSection } from '@/components/step3/VideoReferenceCaseSection';

export default function Step3() {
  const [personalInfo, setPersonalInfo] = useState('');
  const [platform, setPlatform] = useState('');
  const [audience, setAudience] = useState('');
  const [accountStatus, setAccountStatus] = useState('');

  // AC-5: 留 US-010b 改为 !!generated && !isLoading
  const canBulkActions = false;
  // AC-6: 留 US-010b 改为从 step1 继承
  const industry = '美业';

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // tRPC mutation 留 US-010b
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* 1. Step3PageHeader */}
      <Step3PageHeader
        industry={industry}
        canBulkActions={canBulkActions}
      />

      {/* 2. Step3Form */}
      <Step3Form
        personalInfo={personalInfo}
        onPersonalInfoChange={setPersonalInfo}
        platform={platform}
        onPlatformChange={setPlatform}
        audience={audience}
        onAudienceChange={setAudience}
        accountStatus={accountStatus}
        onAccountStatusChange={setAccountStatus}
        onSubmit={handleSubmit}
        isLoading={false}
        isDisabled={!personalInfo.trim() || !platform}
      />

      {/* 3. Step3SectionDivider */}
      <Step3SectionDivider />

      {/* 4-9. 6 H3 sections — AC-4: always render, skeleton when empty */}
      <VideoReferenceCaseSection
        cases={[]}
        canGenerate={canBulkActions}
      />

      <NicknameRecommendSection
        nicknames={[]}
      />

      <AvatarDesignSection
        content={undefined}
        canViewImage={canBulkActions}
      />

      <BackgroundImageDesignSection
        content={undefined}
        canGenerate={canBulkActions}
      />

      <IntroCopySection
        entries={[]}
      />

      <OverallStrategySection
        content={undefined}
      />
    </main>
  );
}
