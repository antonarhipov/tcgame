'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRunState } from '@/contexts/RunStateContext';
import { getMeterTier, getInsights, mulberry32 } from '@/lib/scaling-meter';
import { getUnluckMessage } from '@/lib/content-pack';
import { toPng } from 'html-to-image';

interface FinaleScreenProps {
  onStartOver: () => void;
}

/**
 * Finale screen component showing the final results and journey summary
 */
export function FinaleScreen({ onStartOver }: FinaleScreenProps) {
  const { runState, contentPack, resetRun } = useRunState();
  const startOverRef = useRef<HTMLButtonElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  const currentPack = contentPack;
  const finalMeter = runState.lastMeter || 0;
  const meterTier = getMeterTier(finalMeter);
  const finalInsights = getInsights(runState.effective, { R: 0, U: 0, S: 0, C: 0, I: 0 });

  useEffect(() => {
    // Focus start over button when component mounts
    if (startOverRef.current) {
      startOverRef.current.focus();
    }
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleStartOver();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartOver = () => {
    resetRun();
    onStartOver();
  };

  const handleShareResults = async () => {
    if (!shareCardRef.current) return;
    
    setIsGeneratingCard(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        quality: 0.95,
        width: 800,
        height: 1000,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `startup-journey-${meterTier.tier.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to generate shareable card:', error);
      // Could add user-facing error message here
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Calculate journey summary
  const choicesSummary = runState.choices.map((choice, index) => {
    const step = currentPack.steps[index];
    const choiceData = choice.choice === 'A' ? step.optionA : step.optionB;
    return {
      step: index + 1,
      choice: choice.choice,
      label: choiceData.label,
      delta: choice.delta
    };
  });

  // Get ending message based on tier
  const getEndingMessage = (tier: string): { title: string; message: string; emoji: string } => {
    const endings = {
      'Scrappy': {
        title: 'The Scrappy Founder',
        message: "You've built something from nothing! While you're still in the early stages, your foundation is solid and your determination is clear. Every great company started exactly where you are now.",
        emoji: '🛠️'
      },
      'Finding Fit': {
        title: 'The Product-Market Fit Hunter',
        message: "You're in the sweet spot of discovery! You've found some traction and are learning what works. This is where many successful startups find their breakthrough moment.",
        emoji: '🎯'
      },
      'Gaining Steam': {
        title: 'The Momentum Builder',
        message: "You've hit your stride! Your startup is gaining real momentum and the pieces are coming together. You're building something that could change the game.",
        emoji: '🚂'
      },
      'Scaling Up': {
        title: 'The Scale Master',
        message: "You've cracked the code! Your startup is scaling efficiently and making waves in the market. You're well on your way to becoming a major player in your industry.",
        emoji: '🚀'
      },
      'Breakout Trajectory': {
        title: 'The Unicorn Founder',
        message: "You've achieved legendary status! Your startup is on a breakout trajectory that few ever reach. You're not just building a company, you're reshaping an entire industry.",
        emoji: '🦄'
      }
    };

    return endings[tier as keyof typeof endings] || endings['Scrappy'];
  };

  const ending = getEndingMessage(meterTier.tier);

  return (
    <div className="flex flex-col justify-center min-h-screen py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="text-6xl">{ending.emoji}</div>
          <h1 className="text-4xl font-bold text-[var(--text-hard)]">
            {ending.title}
          </h1>
          <p className="text-xl text-[var(--text-average)] max-w-2xl mx-auto">
            {ending.message}
          </p>
        </div>

        {/* Final meter display */}
        <div className="bg-[var(--surface-1)] rounded-md p-8 border border-[var(--border)]">
          <h2 className="text-2xl font-semibold text-[var(--text-hard)] mb-6 text-center">
            Final Scaling Meter
          </h2>
          
          <div className="space-y-6">
            {/* Overall meter */}
            <div className="text-center">
              <div className="text-4xl font-bold text-[var(--text-hard)] mb-2">
                {Math.round(finalMeter)}/100
              </div>
              <div className="w-full bg-[var(--surface-2)] rounded-full h-6 mb-4">
                <div 
                  className="h-6 rounded-full transition-all duration-2000"
                  style={{ 
                    width: `${Math.max(0, Math.min(100, finalMeter))}%`,
                    background: 'var(--gradient-a)'
                  }}
                ></div>
              </div>
              <div className="text-lg font-medium text-[var(--text-average)]">
                {meterTier.tier} ({meterTier.range})
              </div>
            </div>

            {/* Dimension breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(runState.effective).map(([key, value]) => {
                const labels = {
                  R: 'Revenue',
                  U: 'Users',
                  S: 'System',
                  C: 'Customer',
                  I: 'Investor'
                };
                
                return (
                  <div key={key} className="text-center p-4 bg-[var(--surface-2)] rounded-md">
                    <div className="text-sm text-[var(--text-average)] mb-2">
                      {labels[key as keyof typeof labels]}
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-hard)]">
                      {Math.round(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Final insights */}
        {finalInsights && (
          <div className="bg-[var(--surface-2)] rounded-md p-6 border border-[var(--border)]">
            <h2 className="text-xl font-semibold text-[var(--text-hard)] mb-4">
              🎯 Your Journey Insights
            </h2>
            <div className="space-y-3 text-[var(--text-average)]">
              {finalInsights.drivers.length > 0 && (
                <p>
                  <strong className="text-[var(--text-hard)]">Your Strongest Areas:</strong> {finalInsights.drivers.join(', ')}
                </p>
              )}
              {finalInsights.bottleneck && (
                <p>
                  <strong className="text-[var(--text-hard)]">Growth Opportunity:</strong> {finalInsights.bottleneck}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Journey recap */}
        <div className="bg-[var(--surface-1)] rounded-md p-6 border border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--text-hard)] mb-4">
            📊 Your Decision Journey
          </h2>
          <div className="space-y-3">
            {choicesSummary.map((choice, index) => {
              const hist = runState.history[index];
              const unluckApplied = Boolean(hist?.unluckApplied);
              const luckFactorPct = hist?.luckFactor != null ? Math.round((hist.luckFactor as number) * 100) : null;
              const unluckRng = mulberry32(runState.seed + index);
              const unluckMsg = unluckApplied
                ? (getUnluckMessage(currentPack.steps[index], choice.choice as 'A' | 'B', unluckRng) || null)
                : null;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-[var(--surface-2)] rounded border border-[var(--border)]">
                  <div className="flex-1 pr-3">
                    <span className="text-sm font-medium text-[var(--text-hard)]">
                      Step {choice.step}: Option {choice.choice}
                    </span>
                    <p className="text-sm text-[var(--text-average)]">
                      {choice.label}
                    </p>
                    {unluckApplied && (
                      <div className="mt-2 inline-flex items-start gap-2 rounded-md border border-[var(--color-pink)] px-2.5 py-1.5" style={{ backgroundColor: 'rgba(224, 1, 137, 0.1)' }}>
                        <span className="text-[var(--color-pink)] text-xs font-semibold">Unluck</span>
                        <span className="text-xs text-[var(--color-pink)]">
                          {unluckMsg || 'Unluck event — gains reduced'}{luckFactorPct ? ` (gains cut to ${luckFactorPct}%)` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end min-w-[180px]">
                    {Object.entries(choice.delta).map(([key, value]) => {
                      if (value === 0) return null;
                      return (
                        <span
                          key={key}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: value > 0 
                              ? 'rgba(143, 0, 231, 0.1)' 
                              : 'rgba(224, 1, 137, 0.1)',
                            color: value > 0 
                              ? 'var(--color-primary)' 
                              : 'var(--color-pink)'
                          }}
                        >
                          {key}: {value > 0 ? '+' : ''}{value}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Junie's final message */}
        <div className="bg-[var(--surface-1)] rounded-md p-6 border border-[var(--border)]">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white font-bold text-lg">
              J
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-[var(--text-hard)] mb-3">
                Final Message from Junie
              </div>
              <p className="text-[var(--text-average)] leading-relaxed italic">
                {getJunieFinalMessage(meterTier.tier, Math.round(finalMeter))}
              </p>
            </div>
          </div>
        </div>

        {/* Shareable Card (hidden, used for PNG generation) */}
        <div 
          ref={shareCardRef}
          className="fixed -top-[9999px] -left-[9999px] w-[800px] p-8 font-sans"
          style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundColor: '#000000',
            color: '#FFFFFF'
          }}
        >
          <div className="text-center space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <div className="text-5xl">{ending.emoji}</div>
              <h1 className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>
                {ending.title}
              </h1>
              <div className="text-lg max-w-lg mx-auto" style={{ color: 'rgba(255, 255, 255, 0.70)' }}>
                My Startup Journey Results
              </div>
            </div>

            {/* Final Score */}
            <div className="rounded-lg p-6" style={{ backgroundColor: '#0B0B0E' }}>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2" style={{ color: '#FFFFFF' }}>
                  {Math.round(finalMeter)}/100
                </div>
                <div className="w-full rounded-full h-4 mb-3" style={{ backgroundColor: '#121317' }}>
                  <div 
                    className="h-4 rounded-full"
                    style={{ 
                      width: `${Math.max(0, Math.min(100, finalMeter))}%`,
                      background: 'linear-gradient(90deg, #FF021D 0%, #C202D7 46%, #8F00E7 100%)'
                    }}
                  ></div>
                </div>
                <div className="text-lg font-medium" style={{ color: 'rgba(255, 255, 255, 0.70)' }}>
                  {meterTier.tier}
                </div>
              </div>
            </div>

            {/* Key Insights */}
            {finalInsights && (
              <div className="rounded-lg p-4" style={{ backgroundColor: '#121317' }}>
                <h3 className="font-semibold mb-3" style={{ color: '#FFFFFF' }}>Key Insights</h3>
                <div className="space-y-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.70)' }}>
                  {finalInsights.drivers.length > 0 && (
                    <p><strong style={{ color: '#FFFFFF' }}>Strengths:</strong> {finalInsights.drivers.join(', ')}</p>
                  )}
                  {finalInsights.bottleneck && (
                    <p><strong style={{ color: '#FFFFFF' }}>Growth Area:</strong> {finalInsights.bottleneck}</p>
                  )}
                </div>
              </div>
            )}

            {/* Dimensions */}
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(runState.effective).map(([key, value]) => {
                const labels = { R: 'Revenue', U: 'Users', S: 'System', C: 'Customer', I: 'Investor' };
                return (
                  <div key={key} className="text-center p-3 rounded" style={{ backgroundColor: '#0B0B0E' }}>
                    <div className="text-xs mb-1" style={{ color: 'rgba(255, 255, 255, 0.70)' }}>
                      {labels[key as keyof typeof labels]}
                    </div>
                    <div className="text-xl font-bold" style={{ color: '#FFFFFF' }}>
                      {Math.round(value)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="text-center text-sm pt-4" style={{ 
              color: 'rgba(255, 255, 255, 0.50)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <p>Choose Your Own Startup Adventure</p>
              <p>Built with Junie AI</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleShareResults}
              disabled={isGeneratingCard}
              className="text-white font-semibold py-4 px-8 rounded-[20px] transition-all duration-200 focus:outline-none hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: isGeneratingCard ? 'var(--surface-2)' : 'var(--gradient-a)',
                boxShadow: 'none'
              }}
              onFocus={(e) => e.target.style.boxShadow = 'var(--shadow-focus)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            >
              {isGeneratingCard ? 'Generating...' : '📸 Share Results'}
            </button>
            
            <button
              ref={startOverRef}
              onClick={handleStartOver}
              className="bg-transparent border border-[var(--border)] text-[var(--text-hard)] font-semibold py-4 px-8 rounded-[20px] transition-all duration-200 focus:outline-none hover:bg-[rgba(255,255,255,0.06)]"
              style={{ 
                boxShadow: 'none'
              }}
              onFocus={(e) => e.target.style.boxShadow = 'var(--shadow-focus)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            >
              🔄 Start New Journey
            </button>
          </div>
          
          <div className="text-sm text-[var(--text-pale)]">
            <p>Share your results or try different choices!</p>
          </div>
        </div>

        {/* Pack credits */}
        <div className="text-center text-sm text-[var(--text-pale)] border-t border-[var(--divider)] pt-6">
          <p>Content Pack: {currentPack.title} v{currentPack.version}</p>
          {currentPack.author && <p>Created by {currentPack.author}</p>}
          <p className="mt-2">💡 Press Enter or Space to start over</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate Junie's final message based on the final tier and score
 */
function getJunieFinalMessage(tier: string, score: number): string {
  const messages = {
    'Scrappy': [
      `What a journey! We scored ${score}/100, and while we're still scrappy, we've built something real. Every unicorn started exactly where we are now. Ready for round two? 🚀`,
      `Amazing work! ${score}/100 shows we're on the right track. We're scrappy, we're determined, and we're just getting started. The best is yet to come! 💪`,
    ],
    'Finding Fit': [
      `Incredible journey! We hit ${score}/100 and found our groove. We're in that sweet spot where magic happens. I can feel the breakthrough coming! 🎯`,
      `What a ride! ${score}/100 puts us right in the product-market fit zone. We're learning, adapting, and growing. This is where legends are born! ⚡`,
    ],
    'Gaining Steam': [
      `Outstanding! We reached ${score}/100 and we're gaining serious momentum. The engines are firing on all cylinders. Hold on tight, we're accelerating! 🚂`,
      `Phenomenal work! ${score}/100 shows we're hitting our stride. We're not just growing, we're scaling with purpose. The trajectory is beautiful! 📈`,
    ],
    'Scaling Up': [
      `INCREDIBLE! We achieved ${score}/100 and we're in full scaling mode. We're not just playing the game anymore, we're changing it. Unicorn status incoming! 🦄`,
      `AMAZING! ${score}/100 puts us in the big leagues. We're scaling like pros and the market is taking notice. This is what dreams are made of! 🌟`,
    ],
    'Breakout Trajectory': [
      `LEGENDARY! We reached ${score}/100 and achieved breakout trajectory! We're not just building a company, we're reshaping the future. History will remember this! 🏆`,
      `PHENOMENAL! ${score}/100 - we've transcended! We're on a trajectory that few ever reach. IPO? That's just the beginning of our story! 🚀🌙`,
    ]
  };

  const tierMessages = messages[tier as keyof typeof messages] || messages['Scrappy'];
  return tierMessages[Math.floor(Math.random() * tierMessages.length)];
}