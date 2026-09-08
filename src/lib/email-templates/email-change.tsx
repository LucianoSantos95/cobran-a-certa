import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

import { main, container, h1, text, link, button, hr, footer, darkModeCss } from './styles'

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail é o endereço atual (HookData.OldEmail). No envio para o NOVO
  // destinatário, `email` é igual ao novo endereço, por isso o texto usa
  // oldEmail para ler "de ANTIGO para NOVO".
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Confirme a troca de e-mail no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirme a troca de e-mail</Heading>
        <Text style={text}>
          Você pediu para trocar o e-mail da sua conta no {siteName} de{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>
            {oldEmail}
          </Link>{' '}
          para{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Confirmar troca
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Se você não pediu esta troca, proteja sua conta imediatamente.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
