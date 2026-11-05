import { useEffect, useState } from "react";
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
  CDSFlag,
  CDSCurrency,
  CDSToast,
  CdsToastBasicImpl, // ⚠️ nome usado no Storybook; confirme se é exportado assim
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

import { useDiagnostics } from "./lib/useDiagnostics";
import { applyMode, followSystemMode, initialMode, type Mode } from "./lib/theme";
import { sendToNative, type BridgeMessage } from "./lib/bridge";

/*
 * Jornada em 3 etapas, igual ao canvas "POC Colmeia em WebView":
 *   1. Início e diagnóstico
 *   2. Formulário (+ drawer com campo)
 *   3. Conclusão  -> "Concluir" abre o modal de confirmação
 */
type Step = 1 | 2 | 3;
const TOTAL_STEPS = 3;

// Os componentes podem entregar no onChange um evento ou o valor direto.
const valueOf = (e: any) => e?.target?.value ?? e;
const checkedOf = (e: any, fallback: boolean) =>
  typeof e === "boolean" ? e : e?.target?.checked ?? fallback;

export default function App() {
  // ---------------- Estado ----------------
  const [mode, setMode] = useState<Mode>(initialMode());
  const [step, setStep] = useState<Step>(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(true);
  const [contact, setContact] = useState("whatsapp");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const [probe, setProbe] = useState<HTMLDivElement | null>(null);
  const diagnostics = useDiagnostics(probe);

  const addLog = (label: string, value?: unknown) => {
    const time = new Date().toLocaleTimeString("pt-BR");
    const text =
      value === undefined ? "" : ` → ${typeof value === "object" ? JSON.stringify(value) : String(value)}`;
    setLog((l) => [`${time} ${label}${text}`, ...l].slice(0, 40));
  };

  // ---------------- Tema ----------------
  useEffect(() => applyMode(mode), [mode]);
  useEffect(() => followSystemMode(setMode), []);

  // ---------------- Mensagens vindas do app nativo ----------------
  useEffect(() => {
    const onNative = (e: Event) => {
      const msg = (e as CustomEvent<BridgeMessage>).detail;
      addLog(`nativo: ${msg.type}`, msg.payload);
      if (msg.type === "setTheme" && (msg.payload === "dark" || msg.payload === "light")) {
        setMode(msg.payload);
      }
    };
    window.addEventListener("colmeia:native", onNative);
    return () => window.removeEventListener("colmeia:native", onNative);
  }, []);

  // Cada etapa começa do topo (como uma tela nova)
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // ---------------- Navegação ----------------
  const goTo = (s: Step) => {
    setStep(s);
    addLog("etapa", s);
    if (s === 3) CdsToastBasicImpl.positive("Etapa 3 de 3", 2500);
  };

  const closeJourney = () => addLog("bridge: close", sendToNative({ type: "close" }));

  const handleBack = () => (step > 1 ? goTo((step - 1) as Step) : closeJourney());

  const handlePrimary = () => {
    if (step === 1) return goTo(2);
    if (step === 2) {
      if (!acceptedTerms) {
        CdsToastBasicImpl.negative("Aceite os termos para continuar.", 4000);
        addLog("validação: termos não aceitos");
        return;
      }
      return goTo(3);
    }
    setModalOpen(true); // etapa 3: "Concluir" abre o modal
  };

  const confirmFinish = () => {
    setModalOpen(false);
    const channel = sendToNative({ type: "finish", payload: { contact, notifications } });
    addLog("bridge: finish", channel);
    CdsToastBasicImpl.positive("Jornada concluída!", 3000);
    setStep(1);
  };

  const copyDiagnostics = async () => {
    const text = Object.entries(diagnostics).map(([k, v]) => `${k}: ${v}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      CdsToastBasicImpl.positive("Diagnóstico copiado.", 2500);
      addLog("clipboard: ok");
    } catch (err) {
      CdsToastBasicImpl.negative("Clipboard bloqueado nesta WebView.", 4000);
      addLog("clipboard: erro", String(err));
    }
  };

  // ---------------- Etapa 1: Início e diagnóstico ----------------
  const stepStart = (
    <CDSFlex direction="col" gap="3x">
      <CDSHeading as="h1" size="lg">Etapa 1 de 3</CDSHeading>
      <CDSParagraph>
        Use esta página dentro do app (iOS e Android) e compare com o navegador.
        Cada bloco testa um ponto crítico de WebView.
      </CDSParagraph>
      <CDSAlert
        open={alertOpen}
        variant="informative"
        heading="Como usar"
        description="Preencha o formulário, abra o modal e o drawer, troque o tema e confira o diagnóstico."
        onClose={() => setAlertOpen(false)}
      />
      <CDSCard>
        <CDSBox p="3x">
          <CDSFlex direction="col" gap="2x">
            <CDSHeading as="h2" size="sm">Diagnóstico do ambiente</CDSHeading>
            <table className="diag-table">
              <tbody>
                {Object.entries(diagnostics).map(([k, v]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <CDSButtonGroup>
              <CDSButtonSecondary size="sm" onClick={copyDiagnostics}>
                Copiar diagnóstico
              </CDSButtonSecondary>
              <CDSButtonMini
                onClick={() => addLog("bridge: ping", sendToNative({ type: "ping", payload: Date.now() }))}
              >
                Enviar ping ao app
              </CDSButtonMini>
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
        onChange={(e: any) => addLog("nome", valueOf(e))}
      />
      <CDSInputText
        name="cpf"
        label="CPF"
        mask="CPF"
        placeholder="000.000.000-00"
        supportText="Máscara CPF: deve abrir teclado numérico"
        onChange={(e: any) => addLog("cpf", valueOf(e))}
      />
      <CDSInputText
        name="celular"
        label="Celular"
        mask="DDD_PHONE"
        placeholder="(00) 00000-0000"
        onChange={(e: any) => addLog("celular", valueOf(e))}
      />
      <CDSInputText
        name="valor"
        label="Valor"
        mask="CURRENCY"
        placeholder="R$ 0,00"
        onChange={(e: any) => addLog("valor", valueOf(e))}
      />
      <CDSInputDate
        name="nascimento"
        label="Data de nascimento"
        supportText="Calendário do Colmeia (não é o picker nativo)"
        mode="single"
        onSelectDate={(d: unknown) => addLog("data", d)}
      />
      <CDSInputSelect
        name="estado"
        label="Estado"
        supportText="Usa select: deve abrir o seletor nativo do sistema"
        onChange={(e: any) => addLog("estado", valueOf(e))}
      >
        <option value="">Selecione uma opção</option>
        <option value="RS">Rio Grande do Sul</option>
        <option value="SP">São Paulo</option>
        <option value="PR">Paraná</option>
      </CDSInputSelect>

      <CDSFlex direction="col" gap="1x">
        <CDSDescription>Contato preferido</CDSDescription>
        {[
          ["whatsapp", "WhatsApp"],
          ["email", "E-mail"],
          ["telefone", "Telefone"],
        ].map(([value, label]) => (
          <CDSRadioButton
            key={value}
            name="contato"
            value={value}
            checked={contact === value}
            onChange={() => {
              setContact(value);
              addLog("contato", value);
            }}
          >
            {label}
          </CDSRadioButton>
        ))}
      </CDSFlex>

      <CDSFlex direction="col" gap="1x">
        <CDSSwitch
          checked={notifications}
          onChange={(e: any) => {
            const v = checkedOf(e, !notifications);
            setNotifications(v);
            addLog("notificações", v);
          }}
        >
          Receber notificações
        </CDSSwitch>
        <CDSSwitch
          checked={mode === "dark"}
          onChange={(e: any) => {
            const v = checkedOf(e, mode !== "dark");
            setMode(v ? "dark" : "light");
            addLog("modo escuro", v);
          }}
        >
          Modo escuro (forçar)
        </CDSSwitch>
        <CDSCheckbox
          checked={acceptedTerms}
          onChange={(e: any) => {
            const v = checkedOf(e, !acceptedTerms);
            setAcceptedTerms(v);
            addLog("termos", v);
          }}
        >
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
                onChange={(e: any) => addLog("apelido", valueOf(e))}
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
        <CDSCurrency label={1234.56} size="lg" />
      </CDSFlex>
      <CDSFlag
        variant="warning"
        heading="Ícones e fontes"
        description="Confira se ícones e a fonte da marca carregaram, sem quadrados ou fonte padrão."
      />
      <CDSListNavigation
        variant="icon"
        items={[
          { label: "Pix", description: "Área Pix", icon: "PixLine" },
          { label: "Cartões", description: "Seus cartões", icon: "CreditCardLine" },
          { label: "Ajuda", description: "Central de ajuda", icon: "HelpLine" },
        ]}
        onItemClick={(item: any) => addLog("lista", item?.label ?? item)}
      />
      <CDSCard>
        <CDSBox p="3x">
          <CDSFlex direction="col" gap="2x">
            <CDSHeading as="h2" size="sm">Log de eventos</CDSHeading>
            <ul className="event-log">
              {log.length === 0 && <li>Nenhum evento ainda.</li>}
              {log.map((l, i) => (
                <li key={i}>{l}</li>
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
      <div className="safe-probe" ref={setProbe} />

      {/* Cabeçalho: voltar, título, etapa, fechar (X) e progresso */}
      <div className="safe-top">
        <CDSHeaderProduct
          type="flow"
          heading="Teste Colmeia em WebView"
          description={`Etapa ${step} de ${TOTAL_STEPS}`}
          steps={TOTAL_STEPS}
          current={step}
          onBackButtonProps={{ "aria-label": "Voltar", onClick: handleBack }}
        >
          <CDSButtonIcon aria-label="Fechar" icon="CloseLine" size="sm" onClick={closeJourney} />
        </CDSHeaderProduct>
      </div>

      <CDSSection px="3x" py="1x">
        {step === 1 && stepStart}
        {step === 2 && stepForm}
        {step === 3 && stepFinish}
      </CDSSection>

      {/* Barra fixa inferior com a safe area de baixo */}
      <div
        className="safe-bottom"
        style={{ position: "sticky", bottom: 0, zIndex: 10, background: "var(--color-surface-base, Canvas)" }}
      >
        <CDSFixedBar position="relative">
          <CDSButtonGroup>
            <CDSButtonPrimary size="lg" onClick={handlePrimary}>
              {step < TOTAL_STEPS ? "Continuar" : "Concluir"}
            </CDSButtonPrimary>
          </CDSButtonGroup>
        </CDSFixedBar>
      </div>

      {/* Modal de confirmação: aberto pelo "Concluir" da etapa 3 */}
      <CDSModalRoot
        open={modalOpen}
        onOpenChange={(o: boolean) => setModalOpen(o)}
        onCloseChange={(c: boolean) => setModalOpen(c)}
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
                <CDSButtonPrimary onClick={confirmFinish}>Confirmar</CDSButtonPrimary>
                <CDSButtonSecondary onClick={() => setModalOpen(false)}>Cancelar</CDSButtonSecondary>
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
