import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Link,
  Button,
  Hr,
  Img,
} from '@react-email/components';

interface InvitationEmailProps {
  inviterName: string;
  companyName: string;
  accessLevel: string;
  invitationLink: string;
  recipientEmail: string;
}

export const InvitationEmail: React.FC<InvitationEmailProps> = ({
  inviterName,
  companyName,
  accessLevel,
  invitationLink,
  recipientEmail,
}) => {
  const previewText = `You're invited to join ${companyName} on Xyreg`;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerHeading}>🎉 You're Invited!</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={mainHeading}>
              Join <span style={companyHighlight}>{companyName}</span> on Xyreg
            </Heading>

            <Text style={paragraph}>Hello!</Text>

            <Text style={paragraph}>
              <strong>{inviterName}</strong> has invited you to join{' '}
              <strong>{companyName}</strong> on Xyreg platform.
            </Text>

            <Section style={accessLevelBox}>
              <Text style={accessLevelText}>
                <strong>Your Access Level:</strong>{' '}
                {accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1)}
              </Text>
            </Section>

            <Text style={paragraph}>
              Click the button below to accept your invitation and get started:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={invitationLink}>
                Accept Invitation
              </Button>
            </Section>

            <Text style={paragraph}>
              If the button doesn't work, you can copy and paste this link into your browser:
            </Text>

            <Section style={linkFallback}>
              <Text style={linkText}>{invitationLink}</Text>
            </Section>

            <Text style={paragraph}>
              If you have any questions, feel free to reach out to {inviterName} or our support team.
            </Text>

            <Text style={welcomeText}>
              <strong>Welcome to the team!</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              <strong>Xyreg</strong> - Your Company Management Platform
            </Text>
            <Text style={footerText}>© 2025 Xyreg. All rights reserved.</Text>
            <Text style={footerText}>
              This invitation was sent to {recipientEmail}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,sans-serif',
};

const container = {
  margin: '40px auto',
  padding: '0',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const header = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '40px 30px',
  textAlign: 'center' as const,
};

const headerHeading = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '600',
  margin: '0',
  lineHeight: '1.2',
};

const content = {
  padding: '40px 30px',
};

const mainHeading = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 20px 0',
  lineHeight: '1.2',
};

const companyHighlight = {
  color: '#667eea',
  fontWeight: '600',
};

const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const accessLevelBox = {
  backgroundColor: '#f3f4f6',
  padding: '12px 20px',
  borderRadius: '8px',
  borderLeft: '4px solid #667eea',
  margin: '20px 0',
};

const accessLevelText = {
  color: '#374151',
  fontSize: '16px',
  margin: '0',
  fontWeight: '500',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#667eea',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  border: 'none',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
};

const linkFallback = {
  backgroundColor: '#f9fafb',
  padding: '15px',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
  margin: '15px 0',
};

const linkText = {
  color: '#374151',
  fontSize: '14px',
  fontFamily: 'monospace',
  wordBreak: 'break-all' as const,
  margin: '0',
};

const welcomeText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 16px 0',
};

const footer = {
  padding: '30px',
  backgroundColor: '#f9fafb',
  textAlign: 'center' as const,
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '0 0 20px 0',
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '5px 0',
};

export default InvitationEmail;