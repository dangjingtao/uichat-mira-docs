import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Download,
  GitBranch,
  Laptop,
  Smartphone,
} from "lucide-react";
import {
  mobileLandingFacts,
  mobileLandingMeta,
  mobileLandingPaths,
} from "../content/mobile-landing";

const mobileRepoUrl = "https://github.com/uichat-mira/mira-mobile";
const mobileReleasesUrl = "https://github.com/uichat-mira/mira-mobile/releases";

export default function MobileLandingPage({ footer }: { footer: ReactNode }) {
  return (
    <div className="mobile-landing-page">
      <main>
        <section className="mobile-landing-hero">
          <div className="mobile-landing-wrap mobile-landing-hero-grid">
            <div className="mobile-landing-hero-copy">
              <span className="mobile-landing-kicker">MIRA MOBILE · PREVIEW</span>
              <h1>Mira，跟你一起出门。</h1>
              <p className="mobile-landing-lede">
                在手机上直接使用自己的模型，也可以连接桌面端 Mira，把更重的能力留在电脑。
                Mobile 不是 Desktop 的缩小版，而是一个更贴身的入口。
              </p>
              <div className="mobile-landing-actions">
                <a
                  className="mobile-landing-button primary"
                  href={mobileReleasesUrl}
                  data-mobile-download="android"
                >
                  <Download size={16} aria-hidden="true" />
                  Android APK
                </a>
                <a
                  className="mobile-landing-button"
                  href={mobileReleasesUrl}
                  data-mobile-download="ios"
                >
                  iOS IPA
                </a>
                <a
                  className="mobile-landing-button quiet"
                  href={mobileRepoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <GitBranch size={16} aria-hidden="true" />
                  源码
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </div>
              <p className="mobile-landing-note">
                Android 为已签名 dev APK；iOS 当前提供未签名真机 IPA，需要自行签名或侧载。
              </p>
            </div>

            <div className="mobile-landing-phone-stage" aria-hidden="true">
              <div className="mobile-landing-phone">
                <div className="mobile-landing-phone-screen">
                  <div className="mobile-landing-phone-notch" />
                  <div className="mobile-landing-phone-brand">Mira</div>
                  <div className="mobile-landing-phone-bubble me">
                    今晚回去继续刚才那段对话。
                  </div>
                  <div className="mobile-landing-phone-bubble">
                    可以。你也可以连接桌面 Mira，把更重的工作交给电脑。
                  </div>
                  <div className="mobile-landing-phone-status">
                    DESKTOP HOST CONNECTED
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mobile-landing-section">
          <div className="mobile-landing-wrap">
            <div className="mobile-landing-heading">
              <div>
                <span className="mobile-landing-section-index">01 / DUAL ENTRY</span>
                <h2>同一个 Mira，两种进入方式。</h2>
              </div>
              <p>
                手机端不要求桌面端时刻在线。轻量工作自己完成，需要桌面环境时再连接 Desktop Host。
              </p>
            </div>

            <div className="mobile-landing-paths">
              {mobileLandingPaths.map((item) => {
                const Icon = item.key === "local" ? Smartphone : Laptop;
                return (
                  <article className="mobile-landing-path-card" key={item.key}>
                    <div className="mobile-landing-path-top">
                      <span>{item.eyebrow}</span>
                      <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="mobile-landing-endpoint">{item.endpoint}</div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mobile-landing-section">
          <div className="mobile-landing-wrap">
            <div className="mobile-landing-heading compact">
              <div>
                <span className="mobile-landing-section-index">02 / CURRENT</span>
                <h2>现在已经跑起来的部分。</h2>
              </div>
              <p>不把规划写成能力。这里仅列当前已有的 Mobile 基础能力。</p>
            </div>

            <div className="mobile-landing-facts">
              {mobileLandingFacts.map((item, index) => (
                <article key={item.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mobile-landing-section mobile-landing-principle-section">
          <div className="mobile-landing-wrap mobile-landing-principle">
            <div>
              <span className="mobile-landing-section-index">03 / ROLE</span>
              <h2>不是把 Desktop 塞进一块更小的屏幕。</h2>
            </div>
            <div className="mobile-landing-principle-copy">
              <p>
                手机更适合发起、继续、查看和确认。文件、终端以及依赖桌面环境的重能力，
                不必为了“功能齐全”强行搬进 Mobile。
              </p>
              <p>
                需要轻的时候，手机可以自己完成；需要重的时候，它知道桌面 Mira 还在那里。
              </p>
              <div className="mobile-landing-role-line">
                <span>MOBILE</span>
                <i aria-hidden="true" />
                <span>DESKTOP HOST</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mobile-landing-section mobile-landing-download-section">
          <div className="mobile-landing-wrap">
            <div className="mobile-landing-download">
              <div>
                <span className="mobile-landing-section-index">PREVIEW</span>
                <h2>{mobileLandingMeta.title} 还在快速变化。</h2>
                <p>
                  Android 是目前更直接的体验入口；iOS 真机包仍属于测试分发。
                </p>
              </div>
              <div className="mobile-landing-download-actions">
                <a
                  className="mobile-landing-button primary"
                  href={mobileReleasesUrl}
                  data-mobile-download="android"
                >
                  <Download size={16} aria-hidden="true" />
                  Android APK
                </a>
                <a
                  className="mobile-landing-button"
                  href={mobileReleasesUrl}
                  data-mobile-download="ios"
                >
                  iOS IPA
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      {footer}
    </div>
  );
}
