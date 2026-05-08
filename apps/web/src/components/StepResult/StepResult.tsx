import { Step1Result } from './Step1Result';
import { Step3Result } from './Step3Result';
import { Step3bResult } from './Step3bResult';
import { Step4Result } from './Step4Result';
import { Step4bResult } from './Step4bResult';
import { Step5Result } from './Step5Result';
import { Step6Result } from './Step6Result';
import { Step7Result } from './Step7Result';
import { Step8Result } from './Step8Result';

interface StepResultProps {
  stepKey: string;
  data: unknown;
  isFallback: boolean;
}

export function StepResult({ stepKey, data, isFallback }: StepResultProps) {
  switch (stepKey) {
    case 'step1':
      return <Step1Result data={data} isFallback={isFallback} />;
    case 'step3':
      return <Step3Result data={data} isFallback={isFallback} />;
    case 'step3b':
      return <Step3bResult data={data} isFallback={isFallback} />;
    case 'step4':
      return <Step4Result data={data} isFallback={isFallback} />;
    case 'step4b':
      return <Step4bResult data={data} isFallback={isFallback} />;
    case 'step5':
      return <Step5Result data={data} isFallback={isFallback} />;
    case 'step6':
      return <Step6Result data={data} isFallback={isFallback} />;
    case 'step7':
      return <Step7Result data={data} isFallback={isFallback} />;
    case 'step8':
      return <Step8Result data={data} isFallback={isFallback} />;
    default:
      return null;
  }
}
