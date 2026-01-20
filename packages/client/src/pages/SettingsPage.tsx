import { Container, Flex, Heading } from '@radix-ui/themes';
import { NotificationSettings } from '../components/Settings';

export function SettingsPage(): JSX.Element {
  return (
    <Container size="2" p="4">
      <Flex direction="column" gap="4">
        <Heading size="6">Settings</Heading>
        <NotificationSettings />
      </Flex>
    </Container>
  );
}
