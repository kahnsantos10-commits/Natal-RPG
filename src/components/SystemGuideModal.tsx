import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  BookOpen,
  Award,
  Heart,
  Settings,
  Dice5,
  Sparkles,
  Shield,
  Brain,
  Flame,
  User,
  Activity,
  Scroll,
  HelpCircle,
  Clock,
  Layers,
  Volume2,
  Sword
} from "lucide-react";
import { RPGSystem } from "../types";

interface SystemGuideModalProps {
  onClose: () => void;
  currentSystem: RPGSystem;
}

type GuideTab = "regras" | "pontos" | "vida" | "app";

export const SystemGuideModal: React.FC<SystemGuideModalProps> = ({ onClose, currentSystem }) => {
  const [activeTab, setActiveTab] = useState<GuideTab>("regras");
  const [activeSystemTab, setActiveSystemTab] = useState<RPGSystem>(currentSystem);

  const getSystemName = (sys: RPGSystem) => {
    switch (sys) {
      case "ordem":
        return "Ordem Paranormal";
      case "dnd5e":
        return "D&D 5ª Edição";
      case "tormenta20":
        return "Tormenta 20";
      case "custom":
      default:
        return "Sistema Livre (Custom)";
    }
  };

  const renderRegras = (sys: RPGSystem) => {
    switch (sys) {
      case "ordem":
        return (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Brain className="w-5 h-5" />
              <span>O Outro Lado e Investigação Paranormal</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Em <strong>Ordem Paranormal</strong>, você joga como um agente da <strong>Ordo Realitas</strong>, uma organização secreta que combate criaturas do Outro Lado e impede que a membrana que separa a nossa realidade do paranormal se rompa.
            </p>
            <div className="bg-neutral-900/60 border border-amber-500/10 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-sm font-semibold text-amber-200">Como funciona o Teste de Atributo:</h4>
              <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
                <li>O valor do seu Atributo (Força, Agilidade, Intelecto, Vigor ou Presença) define o <strong>número de dados d20</strong> que você rolará.</li>
                <li>Você rola todos os dados e escolhe <strong>apenas o maior resultado obtido</strong>.</li>
                <li>Se tiver <strong>Atributo 0</strong> em alguma característica, você rola <strong>2 dados d20 e escolhe o PIOR resultado</strong>.</li>
                <li>Soma-se ao maior dado o bônus de sua perícia treinada (ex: Ocultismo +5 para treinado).</li>
              </ul>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-800">
                <span className="text-xs font-bold text-neutral-300 block mb-1">NEX (Nível de Exposição)</span>
                <p className="text-[11px] text-neutral-400">Representa a porcentagem de exposição de sua alma ao paranormal. Vai de 5% a 99% e dita o desbloqueio de rituais, novos poderes e acréscimo de vida/sanidade.</p>
              </div>
              <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-800">
                <span className="text-xs font-bold text-neutral-300 block mb-1">Dificuldade do Teste (DT)</span>
                <p className="text-[11px] text-neutral-400">Definido pelo perigo ou pelo mestre. DTs comuns são 15 (Normal), 20 (Difícil) ou 25 (Extremo). Superar a DT significa sucesso na ação investigativa ou de combate.</p>
              </div>
            </div>
          </div>
        );
      case "dnd5e":
        return (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Shield className="w-5 h-5" />
              <span>Fantasia Medieval Heroica</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              No sistema <strong>D&D 5e</strong>, os jogadores criam heróis de diversas raças e classes (Guerreiro, Mago, Ladino, etc.) e realizam jornadas lendárias em masmorras e reinos fantásticos.
            </p>
            <div className="bg-neutral-900/60 border border-amber-500/10 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-sm font-semibold text-amber-200">A Estrutura de Resolução (A Regra de Ouro):</h4>
              <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
                <li>Rola-se sempre <strong>1 único d20</strong>.</li>
                <li>Soma-se o <strong>Modificador de Atributo</strong> relevante à ação.</li>
                <li>Soma-se o <strong>Bônus de Proficiência</strong> se o personagem souber usar a perícia, ferramenta ou arma envolvida (+2 no nível 1, aumentando com o nível).</li>
                <li>O resultado final deve ser <strong>igual ou maior</strong> que a Classe de Dificuldade (CD) ou Classe de Armadura (CA) do alvo.</li>
              </ul>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-800">
                <span className="text-xs font-bold text-neutral-300 block mb-1">Vantagem e Desvantagem</span>
                <p className="text-[11px] text-neutral-400">Em circunstâncias favoráveis, rola-se 2 dados d20 e escolhe-se o MAIOR (Vantagem). Em desfavoráveis, rola-se 2 dados d20 e escolhe-se o MENOR (Desvantagem).</p>
              </div>
              <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-800">
                <span className="text-xs font-bold text-neutral-300 block mb-1">Crítico Natural (20 e 1)</span>
                <p className="text-[11px] text-neutral-400">Rolar um 20 natural no d20 em combate é um acerto crítico automático e duplica os dados de dano. Um 1 natural é uma falha crítica automática.</p>
              </div>
            </div>
          </div>
        );
      case "tormenta20":
        return (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Flame className="w-5 h-5" />
              <span>Combate Épico no Mundo de Arton</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              <strong>Tormenta 20</strong> é o sistema nacional onde os heróis enfrentam a corrupção da Tormenta, uma tempestade alienígena de sangue e insetos que consome a realidade de Arton. É um sistema focado em sinergias épicas de combate e customização vasta de personagens.
            </p>
            <div className="bg-neutral-900/60 border border-amber-500/10 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-sm font-semibold text-amber-200">Cálculo de Testes em T20:</h4>
              <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
                <li>Rola-se <strong>1d20</strong>.</li>
                <li>Soma-se <strong>Metade do Nível do Personagem</strong> (arredondado para baixo).</li>
                <li>Soma-se o <strong>Modificador de Atributo</strong> correspondente.</li>
                <li>Soma-se o bônus de <strong>Perícia Treinada</strong> (+2 no nível 1, aumentando conforme o nível) ou outros modificadores de equipamentos e bônus de magias.</li>
              </ul>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-800">
                <span className="text-xs font-bold text-neutral-300 block mb-1">Pontos de Mana (PM)</span>
                <p className="text-[11px] text-neutral-400">Diferente de D&D, todas as classes ativam suas habilidades, magias e truques gastando Pontos de Mana (PM). O gerenciamento de PM é a chave para vencer batalhas.</p>
              </div>
              <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-800">
                <span className="text-xs font-bold text-neutral-300 block mb-1">Testes de Resistência</span>
                <p className="text-[11px] text-neutral-400">Fortitude (Constituição), Reflexos (Destreza) e Vontade (Sabedoria) servem para resistir a perigos, magias inimigas e venenos em Arton.</p>
              </div>
            </div>
          </div>
        );
      case "custom":
      default:
        return (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Award className="w-5 h-5" />
              <span>Sistema Adaptável e Narrativo</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              O <strong>Sistema Livre</strong> é ideal para jogar com sistemas alternativos (GURPS, Call of Cthulhu, Storyteller/Vampiro) ou regras próprias criadas pelo seu grupo.
            </p>
            <div className="bg-neutral-900/60 border border-amber-500/10 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-sm font-semibold text-amber-200">Flexibilidade Total:</h4>
              <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
                <li>Não há restrição de dados: use a <strong>Torre de Dados</strong> para rolar d4, d6, d8, d10, d12, d20 ou d100 de acordo com as regras que desejar.</li>
                <li>As fichas de personagem se adaptam para exibir os campos numéricos flexíveis e notas livres.</li>
                <li>Use o mapa 3D com as réguas de distância personalizadas para calcular distâncias e movimentações sem restrições de escala.</li>
              </ul>
            </div>
          </div>
        );
    }
  };

  const renderPontos = (sys: RPGSystem) => {
    switch (sys) {
      case "ordem":
        return (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Brain className="w-5 h-5" />
              <span>Atributos de 0 a 5 e Perícias</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Os atributos em Ordem Paranormal representam o número direto de dados e costumam variar de <strong>0 a 5</strong> para humanos normais.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-800">
                <span className="font-bold text-amber-200">Atributos Primários:</span>
                <ul className="mt-1 space-y-1 text-neutral-400">
                  <li><strong>AGI (Agilidade):</strong> Velocidade, pontaria, reflexos.</li>
                  <li><strong>FOR (Força):</strong> Dano corpo a corpo, carregar carga, atletismo.</li>
                  <li><strong>INT (Intelecto):</strong> Investigação, rituais, conhecimento geral.</li>
                  <li><strong>PRE (Presença):</strong> Vontade, diplomacia, resistência mental, iniciativa.</li>
                  <li><strong>VIG (Vigor):</strong> Pontos de vida máximos e resistência física.</li>
                </ul>
              </div>
              <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-800">
                <span className="font-bold text-amber-200">Níveis de Perícia (Soma direta):</span>
                <ul className="mt-1 space-y-1 text-neutral-400">
                  <li><strong>Não treinado:</strong> Rola apenas Atributo (Soma +0)</li>
                  <li><strong>Treinado:</strong> Soma +5 no resultado do dado</li>
                  <li><strong>Veterano:</strong> Soma +10 no resultado do dado</li>
                  <li><strong>Expert:</strong> Soma +15 no resultado do dado</li>
                </ul>
              </div>
            </div>
          </div>
        );
      case "dnd5e":
        return (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Shield className="w-5 h-5" />
              <span>Cálculo de Modificadores e Proficiência</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Em D&D, os atributos variam normalmente de <strong>1 a 20</strong> (sendo 10 o humano médio). O valor do teste depende sempre do <strong>Modificador</strong> derivado do atributo.
            </p>
            <div className="bg-neutral-900/60 border border-amber-500/10 rounded-2xl p-4 text-xs space-y-2">
              <div className="font-semibold text-amber-200">Fórmula de Modificador:</div>
              <div className="font-mono bg-black/40 p-2 rounded-lg text-center text-amber-400 text-sm font-bold">
                Modificador = (Valor do Atributo - 10) / 2 [Arredondado para baixo]
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400 pt-1">
                <div>• Atributo 10-11: <strong>Modificador +0</strong></div>
                <div>• Atributo 12-13: <strong>Modificador +1</strong></div>
                <div>• Atributo 14-15: <strong>Modificador +2</strong></div>
                <div>• Atributo 16-17: <strong>Modificador +3</strong></div>
                <div>• Atributo 18-19: <strong>Modificador +4</strong></div>
                <div>• Atributo 20-21: <strong>Modificador +5</strong></div>
              </div>
            </div>
          </div>
        );
      case "tormenta20":
        return (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Flame className="w-5 h-5" />
              <span>Atributos Diretos e Perícias Treinadas</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              No sistema Tormenta 20, os atributos são expressos diretamente em modificadores (como Força +3, Inteligência +1), facilitando a matemática do jogo.
            </p>
            <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 text-xs space-y-2">
              <h4 className="font-semibold text-amber-200">Como as Perícias Progridem:</h4>
              <p className="text-neutral-400">
                O bônus de teste em uma perícia que você treinou aumenta a cada nível! Você soma <strong>Metade do seu Nível</strong> + <strong>Modificador do Atributo</strong> + <strong>Treino</strong> (+2 no nível 1, subindo para +4 no nível 7 e +6 no nível 15).
              </p>
            </div>
          </div>
        );
      case "custom":
      default:
        return (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Award className="w-5 h-5" />
              <span>Pontos Personalizáveis</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              No Sistema Customizado, os atributos e fichas são totalmente flexíveis. Você pode dar nomes personalizados aos atributos nas fichas e ditar os bônus de acordo com as regras que seu grupo joga.
            </p>
          </div>
        );
    }
  };

  const renderVida = (sys: RPGSystem) => {
    switch (sys) {
      case "ordem":
        return (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-lg">
              <Heart className="w-5 h-5" />
              <span>Pontos de Vida, Esforço e Sanidade</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Os agentes da ordem possuem três barras essenciais de recursos para gerenciar que garantem sua sobrevivência física e psicológica.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-neutral-900/50 p-3 rounded-xl border border-rose-500/10">
                <span className="font-bold text-rose-400 block mb-1">Pontos de Vida (PV)</span>
                <p className="text-neutral-400 text-[11px]">
                  Mede a integridade física. Se chegar a <strong>0 PV</strong>, o agente cai em estado de <strong>Morrendo</strong>. A cada rodada deve rolar um teste para não piorar até receber primeiros socorros ou morrer.
                </p>
              </div>
              <div className="bg-neutral-900/50 p-3 rounded-xl border border-blue-500/10">
                <span className="font-bold text-blue-400 block mb-1">Pontos de Esforço (PE)</span>
                <p className="text-neutral-400 text-[11px]">
                  Sua energia para realizar ações extras, usar poderes de trilha de classe e conjurar <strong>Rituais do Outro Lado</strong>. Recuperado totalmente com descanso longo.
                </p>
              </div>
              <div className="bg-neutral-900/50 p-3 rounded-xl border border-purple-500/10">
                <span className="font-bold text-purple-400 block mb-1">Pontos de Sanidade (SAN)</span>
                <p className="text-neutral-400 text-[11px]">
                  Resistência mental. Monstros, rituais e choques causam dano de Sanidade. Ao chegar a <strong>0 SAN</strong>, o agente entra em pânico / <strong>Enlouquecendo</strong> e pode enlouquecer permanentemente na cena.
                </p>
              </div>
            </div>
          </div>
        );
      case "dnd5e":
        return (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-lg">
              <Heart className="w-5 h-5" />
              <span>Gerenciamento de Vida e Sobrevivência</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              D&D 5e foca em uma mecânica bem delimitada para recuperação, escudo e queda do personagem em combate.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-neutral-900/50 p-3 rounded-xl border border-rose-500/10">
                <span className="font-bold text-rose-400 block mb-1">HP Temporário (Temp HP)</span>
                <p className="text-neutral-400 text-[11px]">
                  Representa um escudo protetor contra danos. Recebido através de magias ou habilidades. O dano é subtraído do Temp HP antes de ferir sua vida real. Não acumula se você receber de duas fontes diferentes (prevalece o maior).
                </p>
              </div>
              <div className="bg-neutral-900/50 p-3 rounded-xl border border-amber-500/10">
                <span className="font-bold text-amber-400 block mb-1">Salvaguardas Contra a Morte</span>
                <p className="text-neutral-400 text-[11px]">
                  Ao cair a <strong>0 HP</strong>, você não morre na hora (a menos que sofra dano maciço). No seu turno, rola 1d20 livre: <strong>10 ou mais é Sucesso</strong>, menos de 10 é Falha. Complete 3 sucessos para estabilizar ou 3 falhas para morrer.
                </p>
              </div>
            </div>
          </div>
        );
      case "tormenta20":
        return (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-lg">
              <Heart className="w-5 h-5" />
              <span>Vida e Estado de Sangramento</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              No mundo perigoso de Tormenta 20, cair em combate exige resgate rápido devido ao estado severo de sangramento.
            </p>
            <div className="bg-neutral-900/60 border border-red-500/10 rounded-2xl p-4 text-xs space-y-2">
              <h4 className="font-semibold text-rose-400">Estado Sangrando (0 ou menos PV):</h4>
              <p className="text-neutral-400">
                Ao chegar a 0 ou menos PV, você cai inconsciente e fica <strong>Sangrando</strong>. No início do seu turno, deve fazer um teste de Constituição (CD 15):
              </p>
              <ul className="list-disc list-inside text-neutral-400 space-y-1 pl-2">
                <li><strong>Sucesso:</strong> Você estabiliza, mas continua inconsciente.</li>
                <li><strong>Falha:</strong> Perde 1d6 Pontos de Vida adicionais e continua sangrando.</li>
                <li>Se seus PV negativos igualarem ou superarem a sua <strong>Vida Máxima</strong>, o herói morre de vez.</li>
              </ul>
            </div>
          </div>
        );
      case "custom":
      default:
        return (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-lg">
              <Heart className="w-5 h-5" />
              <span>Métricas de Vida Flexíveis</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Use as barras de HP e recursos em seus tokens de mapa de maneira livre para marcar vida, fadiga, escudos ou pontuação de acordo com as regras de sua mesa.
            </p>
          </div>
        );
    }
  };

  const renderAppFeatures = () => {
    return (
      <div className="space-y-4 animate-in fade-in duration-150 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
          <Settings className="w-4.5 h-4.5" />
          <span>Manual de Recursos do Nosso Aplicativo Virtual</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-200">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Mapa Virtual Inteligente (2D/3D)</span>
            </div>
            <p className="text-neutral-400 text-[11px]">
              Alterne entre visão clássica tática 2D e o revolucionário mapa 3D com tokens circulares e cenários imersivos. Conta com detecção automática de desempenho de FPS para dispositivos antigos.
            </p>
          </div>

          <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-200">
              <Dice5 className="w-4 h-4 text-amber-400" />
              <span>Fórmulas de Dados & Torre de Dados 3D</span>
            </div>
            <p className="text-neutral-400 text-[11px]">
              Escreva rolagens personalizadas como <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300">2d20 + 3</code> ou clique nos dados rápidos. O mestre pode optar por fazer rolagens secretas diretamente para sua tela de mestre.
            </p>
          </div>

          <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Mestre de Inteligência Artificial</span>
            </div>
            <p className="text-neutral-400 text-[11px]">
              O Mestre de IA (AI Master) está integrado ao chat e em seu painel exclusivo para criar ganchos de aventura personalizados, responder regras na hora e narrar combates do sistema escolhido.
            </p>
          </div>

          <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-200">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Mesa de Som (Soundboard Synth)</span>
            </div>
            <p className="text-neutral-400 text-[11px]">
              Toque músicas de atmosfera para combates ou investigação paranormal, além de acionar efeitos sonoros instantâneos de dados, ataques, magias e rituais sobrenaturais.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-amber-500/40 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950/60 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-100 uppercase tracking-wide">
                Guia e Regras do RPG
              </h3>
              <p className="text-[10px] text-neutral-400">
                Aprenda a jogar e entenda os cálculos, pontuações e fichas do sistema ativo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 hover:scale-105 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* System Selector Sub-Tabs */}
        <div className="bg-neutral-950/40 px-6 py-3 border-b border-neutral-800/80 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider mr-2">Sistema Visualizado:</span>
          {(["ordem", "dnd5e", "tormenta20", "custom"] as RPGSystem[]).map((sys) => {
            const isActive = activeSystemTab === sys;
            const isDefaultInRoom = currentSystem === sys;
            return (
              <button
                key={sys}
                onClick={() => setActiveSystemTab(sys)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isActive
                    ? "bg-amber-600/15 border-amber-500/50 text-amber-300 shadow-sm"
                    : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                {getSystemName(sys)}
                {isDefaultInRoom && (
                  <span className="bg-amber-500 text-neutral-950 text-[8px] font-extrabold px-1 rounded uppercase tracking-tighter">Ativo</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Selection */}
        <div className="bg-neutral-905 px-6 border-b border-neutral-800/40 flex gap-2">
          <button
            onClick={() => setActiveTab("regras")}
            className={`py-3 px-4 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "regras"
                ? "border-amber-500 text-amber-400 bg-amber-500/5"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Scroll className="w-3.5 h-3.5" />
            Como Jogar & Regras
          </button>
          <button
            onClick={() => setActiveTab("pontos")}
            className={`py-3 px-4 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "pontos"
                ? "border-amber-500 text-amber-400 bg-amber-500/5"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Cálculo de Pontos
          </button>
          <button
            onClick={() => setActiveTab("vida")}
            className={`py-3 px-4 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "vida"
                ? "border-amber-500 text-amber-400 bg-amber-500/5"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Níveis de Vida & Morte
          </button>
          <button
            onClick={() => setActiveTab("app")}
            className={`py-3 px-4 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "app"
                ? "border-amber-500 text-amber-400 bg-amber-500/5"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Recursos do App
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-900/30 text-neutral-200 space-y-4 max-h-[55vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeSystemTab}-${activeTab}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "regras" && renderRegras(activeSystemTab)}
              {activeTab === "pontos" && renderPontos(activeSystemTab)}
              {activeTab === "vida" && renderVida(activeSystemTab)}
              {activeTab === "app" && renderAppFeatures()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-neutral-950/60 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Precisa de conselhos em tempo real? Use o <strong>Mestre de IA</strong> no chat!</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold rounded-xl transition-all shadow-md"
          >
            Fechar Guia
          </button>
        </div>

      </div>
    </div>
  );
};
