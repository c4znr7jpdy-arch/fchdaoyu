import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { CaveQuickGrid } from './CaveQuickGrid';

describe('CaveQuickGrid', () => {
  it('renders the six cave destinations as whole-tile links without old descriptions', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CaveQuickGrid />
      </MemoryRouter>,
    );

    expect(html).toContain('href="/game/retreat"');
    expect(html).toContain('href="/game/craft/alchemy"');
    expect(html).toContain('href="/game/craft/refine"');
    expect(html).toContain('href="/game/enlightenment"');
    expect(html).toContain('href="/game/map"');
    expect(html).toContain('href="/game/mail"');
    expect(html).toContain('静室');
    expect(html).toContain('玉简案');
    expect(html).not.toContain('收束呼吸');
    expect(html).not.toContain('听传音');
  });
});
