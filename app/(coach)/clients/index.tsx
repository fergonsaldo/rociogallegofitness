import { ScreenShell } from '../../../src/presentation/components/common/ScreenShell';
import { Colors } from '../../../src/shared/constants/theme';

export default function Screen() {
  return (
    <ScreenShell
      title="Clients"
      subtitle="Manage your athletes"
      accentColor={Colors.primary}
    />
  );
}
