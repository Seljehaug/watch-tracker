import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';

// Stand-in pages, so the tests are about App and not about what the real pages render.
@Component({ template: '<h1 tabindex="-1">First page</h1>' })
class FirstPage {}

@Component({ template: '<h1 tabindex="-1">Second page</h1>' })
class SecondPage {}

describe('App', () => {
  let fixture: ComponentFixture<App>;

  const focused = () => document.activeElement;

  async function navigate(url: string): Promise<void> {
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'first', component: FirstPage },
          { path: 'second', component: SecondPage },
        ]),
      ],
    });
    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
  });

  it('leaves focus alone on the first navigation, when the app loads', async () => {
    await navigate('/first');

    expect(focused()).toBe(document.body);
  });

  it("moves focus to the new page's heading after a navigation", async () => {
    await navigate('/first');

    await navigate('/second');

    expect(focused()?.tagName).toBe('H1');
    expect(focused()?.textContent).toBe('Second page');
  });

  it('moves focus again on every later navigation', async () => {
    await navigate('/first');
    await navigate('/second');

    await navigate('/first');

    expect(focused()?.textContent).toBe('First page');
  });
});
