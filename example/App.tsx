import React from 'react';

import '../dist/vendors';

import { createZebrunnerModule, useAngular } from '@zebrunner/core/angularjs';
import { SigninComponent, ZebrunnerReportingModule } from '../dist';

createZebrunnerModule([
  ZebrunnerReportingModule,
]);

function App() {
  const bootstrapped = useAngular();

  if (!bootstrapped) {
    return null;
  }

  return (
    <SigninComponent />
  );
}

export default App;
