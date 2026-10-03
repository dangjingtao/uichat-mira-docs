import type { ReactNode } from "react";
import { ArrowUpRight, GitBranch, Radar, Scale } from "lucide-react";
import {
  aboutLandingMeta,
  aboutOrganizationLinks,
  aboutPrinciples,
  aboutProjects,
} from "../content/about-landing";

export default function AboutLandingPage({ footer }: { footer: ReactNode }) {
  return (
    <div className="about-landing-page">
      <main>
        <section className="about-hero">
          <div className="about-wrap about-hero-grid">
            <div>
              <span className="about-kicker">MIRA ORGANIZATION</span>
              <h1>我们在做 Mira，也在公开它是怎样被做出来的。</h1>
            </div>
            <div className="about-hero-copy">
              <p>
                Mira Organization 围绕本地优先的个人 AI 展开：Desktop 是主要工作空间，
                Mobile 把入口带到手机，Relay 负责连接，Docs 与 Control Room
                把架构、工程和组织状态公开出来。
              </p>
              <div className="about-actions">
                <a
                  className="about-button primary"
                  href={aboutOrganizationLinks.github}
                  target="_blank"
                  rel="noreferrer"
                >
                  <GitBranch size={16} aria-hidden="true" />
                  GitHub Organization
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
                <a
                  className="about-button"
                  href={aboutOrganizationLinks.controlRoom}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Radar size={16} aria-hidden="true" />
                  Control Room
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="about-wrap">
            <div className="about-section-heading">
              <span className="about-index">01 / PROJECTS</span>
              <h2>一个组织，不是一只越来越大的仓库。</h2>
              <p>
                Mira 把不同责任拆给不同项目。它们可以协作，但不会因为方便就互相吞掉边界。
              </p>
            </div>
            <div className="about-project-grid">
              {aboutProjects.map((project, index) => (
                <a
                  className="about-project-card"
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  key={project.key}
                >
                  <div className="about-project-meta">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </div>
                  <h3>{project.name}</h3>
                  <strong>{project.role}</strong>
                  <p>{project.description}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section about-principles-section">
          <div className="about-wrap">
            <div className="about-section-heading compact">
              <span className="about-index">02 / HOW WE BUILD</span>
              <h2>把能力做大，但把责任边界写清楚。</h2>
            </div>
            <div className="about-principle-list">
              {aboutPrinciples.map((item, index) => (
                <article key={item.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section about-fair-work-section">
          <div className="about-wrap about-fair-work">
            <div>
              <span className="about-index">03 / FAIR WORK</span>
              <h2>People are not infrastructure.</h2>
              <p className="about-fair-work-cn">人不是基础设施。</p>
            </div>
            <div>
              <p>
                Mira 反对 996，以及违法、强迫和无偿的过度劳动。开源代码可以被自由使用，
                但这种自由不意味着围绕软件工作的人也成了可以被消耗的资源。
              </p>
              <a
                className="about-text-link"
                href={aboutOrganizationLinks.fairWork}
                target="_blank"
                rel="noreferrer"
              >
                <Scale size={16} aria-hidden="true" />
                阅读 Mira 公平劳动声明
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className="about-section about-closing-section">
          <div className="about-wrap about-closing">
            <span className="about-index">04 / OPEN</span>
            <h2>Mira 还在长。组织也一样。</h2>
            <p>
              想看代码，就去 GitHub；想看组织现在正在发生什么，就打开 Control Room。
              这里不把规划伪装成完成，也不把展示页当成第二个事实源。
            </p>
            <div className="about-actions">
              <a
                className="about-button primary"
                href={aboutOrganizationLinks.github}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
              <a
                className="about-button"
                href={aboutOrganizationLinks.controlRoom}
                target="_blank"
                rel="noreferrer"
              >
                Control Room
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </main>
      {footer}
    </div>
  );
}

export { aboutLandingMeta };
