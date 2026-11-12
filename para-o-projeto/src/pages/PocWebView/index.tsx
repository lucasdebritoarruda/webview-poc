import { useCallback, useEffect, useState, type ReactElement } from "react";
import {
  // Layout
  CDSSection,
  CDSFlex,
  CDSBox,
  CDSCard,
  // Tipografia
  CDSHeading,
  CDSParagraph,
  CDSDescription,
  // Navegação / ações
  CDSHeaderProduct,
  CDSButtonIcon,
  CDSButtonPrimary,
  CDSButtonSecondary,
  CDSButtonMini,
  CDSButtonGroup,
  CDSFixedBar,
  CDSListNavigation,
  // Inputs
  CDSInputText,
  CDSInputDate,
  CDSInputSelect,
  CDSRadioButton,
  CDSCheckbox,
  CDSSwitch,
  // Feedback / conteúdo
  CDSAlert,
  CDSAlertHeading,
  CDSAlertDescription,
  CDSFlag,
  CDSFlagHeading,
  CDSFlagDescription,
  CDSCurrency,
  CDSToast,
  CdsToastBasicImpl,
  // Sobreposições
  CDSModalRoot,
  CDSModalPortal,
  CDSModalOverlay,
  CDSModalContent,
  CDSModalHeader,
  CDSModalBody,
  CDSModalFixedBar,
  CDSDrawerRoot,
  CDSDrawerTrigger,
  CDSDrawerPortal,
  CDSDrawerOverlay,
  CDSDrawerContent,
  CDSDrawerHeader,
  CDSDrawerBody,
  CDSDrawerFixedBar,
} from "@design-system/colmeia-design-system-web";

import { useDiagnostics } from "#/hooks/useDiagnostics";
import { applyLightTheme } from "#/utils/theme";
import { installNativeReceiver, onNativeMessage, sendToNative } from "#/utils/bridge";

/*
 * Jornada em 3 etapas, igual ao canvas "POC Colmeia em WebView":
 *   start  -> Início e diagnóstico
 *   form   -> Formulário (+ drawer com campo)
 *   finish -> Conclusão ("Concluir" abre o modal de confirmação)
 */
type Step = "start" | "form" | "finish";

const TOTAL_STEPS = 3;
const STEP_NUMBER: Record<Step, number> = { start: 1, form: 2, finish: 3 };

const TOAST_SHORT_MS = 2500;
const TOAST_MEDIUM_MS = 3000;
const TOAST_LONG_MS = 4000;
const MAX_LOG_LINES = 40;
const SIMULATED_VALUE = 1234.56;

const CONTACT_OPTIONS: readonly { label: string; value: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
];

const SHORTCUTS = [
  { label: "Pix", description: "Área Pix", icon: "PixLine" },
  { label: "Cartões", description: "Seus cartões", icon: "CreditCardLine" },
  { label: "Ajuda", description: "Central de ajuda", icon: "HelpLine" },
];

// ---------- Leitura segura dos eventos dos componentes ----------
// Os componentes podem entregar no onChange um evento ou o valor direto.

function readTarget(input: unknown): EventTarget | null {
  if (typeof input === "object" && input !== null && "target" in input) {
    return input.target instanceof EventTarget ? input.target : null;
  }
  return null;
}

function readValue(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }
  const target = readTarget(input);
  if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
    return target.value;
  }
  return "";
}

function readFieldName(input: unknown): string {
  const target = readTarget(input);
  if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
    return target.name;
  }
  return "campo";
}

function readChecked(input: unknown, fallback: boolean): boolean {
  if (typeof input === "boolean") {
    return input;
  }
  const target = readTarget(input);
  return target instanceof HTMLInputElement ? target.checked : fallback;
}

function readLabel(input: unknown): string {
  if (typeof input === "object" && input !== null && "label" in input) {
    return typeof input.label === "string" ? input.label : "item";
  }
  return "item";
}

function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toLocaleDateString("pt-BR");
  }
  return JSON.stringify(value);
}

export default function PocWebView(): ReactElement {
  // ---------------- Estado ----------------
  const [step, setStep] = useState<Step>("start");
  const [modalOpen, setModalOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(true);
  const [contact, setContact] = useState("whatsapp");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [probe, setProbe] = useState<HTMLDivElement | null>(null);
  const diagnostics = useDiagnostics(probe);

  const addLog = useCallback((label: string, value?: unknown): void => {
    const time = new Date().toLocaleTimeString("pt-BR");
    const suffix = value === undefined ? "" : ` → ${formatValue(value)}`;
    setEventLog((lines) => [`${time} ${label}${suffix}`, ...lines].slice(0, MAX_LOG_LINES));
  }, []);

  // ---------------- Tema e ponte com o app nativo ----------------
  useEffect((): void => {
    applyLightTheme();
    installNativeReceiver();
  }, []);

  useEffect(
    (): (() => void) =>
      onNativeMessage((message): void => {
        addLog(`nativo: ${message.type}`, message.payload);
      }),
    [addLog],
  );

  // Cada etapa começa do topo (como uma tela nova)
  useEffect((): void => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // ---------------- Navegação ----------------
  const goTo = (next: Step): void => {
    setStep(next);
    addLog("etapa", STEP_NUMBER[next]);
    if (next === "finish") {
      CdsToastBasicImpl.positive("Etapa 3 de 3", TOAST_SHORT_MS);
    }
  };

  const handleClose = (): void => {
    addLog("bridge: close", sendToNative({ type: "close" }));
  };

  const handleBack = (): void => {
    if (step === "finish") {
      goTo("form");
    } else if (step === "form") {
      goTo("start");
    } else {
      handleClose();
    }
  };

  // Props do botão voltar do cabeçalho (o lint exige nome iniciado por "handle")
  const handleBackButtonProps = {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- nome de atributo HTML
    "aria-label": "Voltar",
    onClick: handleBack,
  };

  const handlePrimary = (): void => {
    if (step === "start") {
      goTo("form");
      return;
    }
    if (step === "form") {
      if (!acceptedTerms) {
        CdsToastBasicImpl.negative("Aceite os termos para continuar.", TOAST_LONG_MS);
        addLog("validação: termos não aceitos");
        return;
      }
      goTo("finish");
      return;
    }
    setModalOpen(true); // etapa 3: "Concluir" abre o modal
  };

  // ---------------- Modal ----------------
  const handleModalOpenChange = (isOpen: boolean): void => {
    setModalOpen(isOpen);
  };

  const handleModalCancel = (): void => {
    setModalOpen(false);
  };

  const handleConfirmFinish = (): void => {
    setModalOpen(false);
    const channel = sendToNative({ type: "finish", payload: { contact, notifications } });
    addLog("bridge: finish", channel);
    CdsToastBasicImpl.positive("Jornada concluída!", TOAST_MEDIUM_MS);
    setStep("start");
  };

  // ---------------- Diagnóstico ----------------
  const copyDiagnostics = async (): Promise<void> => {
    const text = diagnostics.map((item): string => `${item.label}: ${item.value}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      CdsToastBasicImpl.positive("Diagnóstico copiado.", TOAST_SHORT_MS);
      addLog("clipboard: ok");
    } catch (error: unknown) {
      CdsToastBasicImpl.negative("Clipboard bloqueado nesta WebView.", TOAST_LONG_MS);
      addLog("clipboard: erro", error instanceof Error ? error.message : "desconhecido");
    }
  };

  const handleCopyDiagnostics = (): void => {
    void copyDiagnostics();
  };

  const handlePing = (): void => {
    addLog("bridge: ping", sendToNative({ type: "ping", payload: Date.now() }));
  };

  const handleAlertClose = (): void => {
    setAlertOpen(false);
  };

  // ---------------- Formulário ----------------
  const handleFieldChange = (input: unknown): void => {
    addLog(readFieldName(input), readValue(input));
  };

  const handleDateSelect = (date: unknown): void => {
    addLog("data", date);
  };

  const handleContactChange = (input: unknown): void => {
    const value = readValue(input);
    setContact(value);
    addLog("contato", value);
  };

  const handleNotificationsChange = (input: unknown): void => {
    const value = readChecked(input, !notifications);
    setNotifications(value);
    addLog("notificações", value);
  };

  const handleTermsChange = (input: unknown): void => {
    const value = readChecked(input, !acceptedTerms);
    setAcceptedTerms(value);
    addLog("termos", value);
  };

  const handleShortcutClick = (item: unknown): void => {
    addLog("lista", readLabel(item));
  };

  // ---------------- Etapa 1: Início e diagnóstico ----------------
  const stepStart = (
    <CDSFlex direction="col" gap="3x">
      <CDSHeading as="h1" size="lg">Etapa 1 de 3</CDSHeading>
      <CDSParagraph>
        Use esta página dentro do app (iOS e Android) e compare com o navegador.
        Cada bloco testa um ponto crítico de WebView.
      </CDSParagraph>
      <CDSAlert open={alertOpen} variant="informative" onClose={handleAlertClose}>
        <CDSAlertHeading>Como usar</CDSAlertHeading>
        <CDSAlertDescription>
          Preencha o formulário, abra o modal e o drawer e confira o diagnóstico.
        </CDSAlertDescription>
      </CDSAlert>
      <CDSCard>
        <CDSBox p="3x">
          <CDSFlex direction="col" gap="2x">
            <CDSHeading as="h2" size="sm">Diagnóstico do ambiente</CDSHeading>
            <table className="w-full border-collapse font-mono text-[13px] text-[color:var(--text-paragraph-color)]">
              <tbody>
                {diagnostics.map((item): ReactElement => (
                  <tr
                    key={item.label}
                    className="block py-2 border-b border-[color:var(--elements-border-subtle-color)]"
                  >
                    <td className="block opacity-70 text-xs mb-0.5">{item.label}</td>
                    <td className="block [overflow-wrap:anywhere]">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <CDSButtonGroup>
              <CDSButtonSecondary size="sm" onClick={handleCopyDiagnostics}>
                Copiar diagnóstico
              </CDSButtonSecondary>
              <CDSButtonMini onClick={handlePing}>Enviar ping ao app</CDSButtonMini>
            </CDSButtonGroup>
          </CDSFlex>
        </CDSBox>
      </CDSCard>
    </CDSFlex>
  );

  // ---------------- Etapa 2: Formulário ----------------
  const stepForm = (
    <CDSFlex direction="col" gap="3x">
      <CDSHeading as="h1" size="lg">Seus dados</CDSHeading>
      <CDSDescription>Teste teclado, máscaras e seletores nativos dentro da WebView.</CDSDescription>

      <CDSInputText
        name="nome"
        label="Nome completo"
        placeholder="Digite seu nome"
        supportText="Teste o autocorretor e o scroll com teclado aberto"
        onChange={handleFieldChange}
      />
      <CDSInputText
        name="cpf"
        label="CPF"
        mask="CPF"
        placeholder="000.000.000-00"
        supportText="Máscara CPF: deve abrir teclado numérico"
        onChange={handleFieldChange}
      />
      <CDSInputText
        name="celular"
        label="Celular"
        mask="DDD_PHONE"
        placeholder="(00) 00000-0000"
        onChange={handleFieldChange}
      />
      <CDSInputText
        name="valor"
        label="Valor"
        mask="CURRENCY"
        placeholder="R$ 0,00"
        onChange={handleFieldChange}
      />
      <CDSInputDate
        name="nascimento"
        label="Data de nascimento"
        supportText="Calendário do Colmeia (não é o picker nativo)"
        mode="single"
        onSelectDate={handleDateSelect}
      />
      <CDSInputSelect
        name="estado"
        label="Estado"
        supportText="Usa select: deve abrir o seletor nativo do sistema"
        onChange={handleFieldChange}
      >
        <option value="">Selecione uma opção</option>
        <option value="RS">Rio Grande do Sul</option>
        <option value="SP">São Paulo</option>
        <option value="PR">Paraná</option>
      </CDSInputSelect>

      <CDSFlex direction="col" gap="1x">
        <CDSDescription>Contato preferido</CDSDescription>
        {CONTACT_OPTIONS.map((option): ReactElement => (
          <CDSRadioButton
            key={option.value}
            name="contato"
            value={option.value}
            checked={contact === option.value}
            onChange={handleContactChange}
          >
            {option.label}
          </CDSRadioButton>
        ))}
      </CDSFlex>

      <CDSFlex direction="col" gap="1x">
        <CDSSwitch checked={notifications} onChange={handleNotificationsChange}>
          Receber notificações
        </CDSSwitch>
        <CDSCheckbox checked={acceptedTerms} onChange={handleTermsChange}>
          Li e aceito os termos
        </CDSCheckbox>
      </CDSFlex>

      {/* Drawer com input dentro: o teste mais sensível em WebView */}
      <CDSDrawerRoot dismissible>
        <CDSDrawerTrigger>
          <CDSButtonSecondary blocked>Abrir drawer com campo</CDSButtonSecondary>
        </CDSDrawerTrigger>
        <CDSDrawerPortal>
          <CDSDrawerOverlay />
          <CDSDrawerContent size="sm">
            <CDSDrawerHeader type="default">Apelido da conta</CDSDrawerHeader>
            <CDSDrawerBody>
              <CDSInputText
                name="apelido"
                label="Apelido"
                placeholder="Ex.: Conta da casa"
                supportText="Ao focar, o teclado não pode cobrir este campo"
                onChange={handleFieldChange}
              />
            </CDSDrawerBody>
            <CDSDrawerFixedBar>
              <CDSButtonGroup>
                <CDSButtonPrimary>Salvar</CDSButtonPrimary>
              </CDSButtonGroup>
            </CDSDrawerFixedBar>
          </CDSDrawerContent>
        </CDSDrawerPortal>
      </CDSDrawerRoot>
    </CDSFlex>
  );

  // ---------------- Etapa 3: Conclusão ----------------
  const stepFinish = (
    <CDSFlex direction="col" gap="3x">
      <CDSHeading as="h1" size="lg">Revise e conclua</CDSHeading>
      <CDSFlex direction="col" gap="1x">
        <CDSDescription>Valor simulado</CDSDescription>
        <CDSCurrency label={SIMULATED_VALUE} size="lg" />
      </CDSFlex>
      <CDSFlag variant="warning">
        <CDSFlagHeading>Ícones e fontes</CDSFlagHeading>
        <CDSFlagDescription>
          Confira se ícones e a fonte da marca carregaram, sem quadrados ou fonte padrão.
        </CDSFlagDescription>
      </CDSFlag>
      <CDSListNavigation variant="icon" items={SHORTCUTS} onItemClick={handleShortcutClick} />
      <CDSCard>
        <CDSBox p="3x">
          <CDSFlex direction="col" gap="2x">
            <CDSHeading as="h2" size="sm">Log de eventos</CDSHeading>
            <ul className="font-mono text-xs max-h-[180px] overflow-y-auto m-0 p-0 list-none">
              {eventLog.length === 0 && <li>Nenhum evento ainda.</li>}
              {eventLog.map((line): ReactElement => (
                <li
                  key={line}
                  className="py-1 border-b border-dashed border-[color:var(--elements-border-subtle-color)]"
                >
                  {line}
                </li>
              ))}
            </ul>
          </CDSFlex>
        </CDSBox>
      </CDSCard>
    </CDSFlex>
  );

  // ---------------- Tela ----------------
  return (
    <>
      {/* Mede as safe areas (invisível) */}
      <div
        ref={setProbe}
        className="fixed invisible pointer-events-none pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
      />

      {/* Cabeçalho: voltar, título, etapa, fechar (X) e progresso */}
      <div className="pt-[env(safe-area-inset-top)]">
        <CDSHeaderProduct
          type="flow"
          heading="Teste Colmeia em WebView"
          description={`Etapa ${String(STEP_NUMBER[step])} de ${String(TOTAL_STEPS)}`}
          steps={TOTAL_STEPS}
          current={STEP_NUMBER[step]}
          onBackButtonProps={handleBackButtonProps}
        >
          <CDSButtonIcon aria-label="Fechar" icon="CloseLine" size="sm" onClick={handleClose} />
        </CDSHeaderProduct>
      </div>

      <CDSSection px="3x" py="1x">
        {step === "start" && stepStart}
        {step === "form" && stepForm}
        {step === "finish" && stepFinish}
      </CDSSection>

      {/* Barra fixa inferior com a safe area de baixo */}
      <div className="sticky bottom-0 z-10 bg-[color:var(--surface-bg-base-color)] pb-[env(safe-area-inset-bottom)]">
        <CDSFixedBar position="relative">
          <CDSButtonGroup>
            <CDSButtonPrimary size="lg" onClick={handlePrimary}>
              {step === "finish" ? "Concluir" : "Continuar"}
            </CDSButtonPrimary>
          </CDSButtonGroup>
        </CDSFixedBar>
      </div>

      {/* Modal de confirmação: aberto pelo "Concluir" da etapa 3 */}
      <CDSModalRoot
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        onCloseChange={handleModalOpenChange}
      >
        <CDSModalPortal>
          <CDSModalOverlay />
          <CDSModalContent>
            <CDSModalHeader>Confirmar dados</CDSModalHeader>
            <CDSModalBody>
              <CDSParagraph>
                Este modal está centralizado e respeitando a área segura? O fundo
                não pode rolar enquanto ele estiver aberto.
              </CDSParagraph>
            </CDSModalBody>
            <CDSModalFixedBar>
              <CDSButtonGroup>
                <CDSButtonPrimary onClick={handleConfirmFinish}>Confirmar</CDSButtonPrimary>
                <CDSButtonSecondary onClick={handleModalCancel}>Cancelar</CDSButtonSecondary>
              </CDSButtonGroup>
            </CDSModalFixedBar>
          </CDSModalContent>
        </CDSModalPortal>
      </CDSModalRoot>

      {/* Container global dos toasts */}
      <CDSToast />
    </>
  );
}
