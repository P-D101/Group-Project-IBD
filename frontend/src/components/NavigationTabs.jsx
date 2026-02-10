import { NavLink } from "react-router-dom";

function NavigationTabs() {
    const tabs = [
        { to: "/", label: "Overview" },
        { to: "/ai-dashboard", label: "AI Dashboard" },
        { to: "/policy-editor", label: "Policy Creator" },
    ];

    return (
        <div className="nav-wrapper" role="navigation" aria-label="Main navigation">
            <div className="nav-links">
                {tabs.map((t) => (
                    <NavLink
                        key={t.to}
                        to={t.to}
                        end={t.to === "/"}
                        className={({ isActive }) =>
                            `nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        {t.label}
                    </NavLink>
                ))}
            </div>

            <div>
                <button className="nav-cta" onClick={() => alert('Get started')}>Get started</button>
            </div>
        </div>
    );
}

export default NavigationTabs;
