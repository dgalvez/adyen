const { html, Component, render } = globalThis.htmPreact;

const appRoot = document.getElementById('app');

/*
 * <CurrencyConverter /> is the main component of our application.
 * Its methods are grouped in this way:
 *     - Life cycle methods.
 *     - Browser/user events methods. 
 *     - render() method. 
 *     - Conversion input helpers.
 *     - URL params helpers.  
 *     - Networking methods.
 */
class CurrencyConverter extends Component {

  constructor(props) {
    super(props);

    this.onInputChanged = this.onInputChanged.bind(this);
    this.onPopState = this.onPopState.bind(this);

    this.state = {
      UIReady: false,
      loading: false,
      sourceCurrency: null,
      targetCurrency: null,
      sourceAmount: null,
      targetAmount: null,
      currencies: [],
      backendError: null
    };

    this.params = {
      sourceCurrency: 'sourceCurrency',
      targetCurrency: 'targetCurrency',
      sourceAmount: 'sourceAmount'
    };
  }

  async componentDidMount() {
    const { currencies = [[]] } = await this.fetchCurrencyList();

    this.setState({
      UIReady: true,
      currencies,
      ...this.getStateFromURL(currencies)
    }, async () => {
      const { from, to, amount } = this.getConversionInput();
      if (this.isValidConversionInput({ from, to, amount })) {
        const { convertedAmount: targetAmount } = await this.fetchConvertedAmount({ from, to, amount });
        this.setState({ targetAmount });
      }
    });

    window.addEventListener('popstate', this.onPopState);
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.onPopState);
  }

  onInputChanged(property, fromSource = false) {
    return ({ currentTarget }) => {

      const originalInputValue = currentTarget.value;
      this.setState({ [property]: originalInputValue }, async () => {

        const { from, to, amount } = this.getConversionInput(fromSource);
        if (this.isValidConversionInput({ from, to, amount })) {

          const { convertedAmount } = await this.fetchConvertedAmount({ from, to, amount });
          if (originalInputValue === currentTarget.value) {
            this.setState({
              [fromSource ? 'targetAmount' : 'sourceAmount']: convertedAmount
            }, () => this.setURLFromState());
          }

        }

      });

    };
  }

  async onPopState() {
    this.setState({
      ...this.getStateFromURL(this.state.currencies)
    }, async () => {
      const { from, to, amount } = this.getConversionInput();
      if (this.isValidConversionInput({ from, to, amount })) {
        const { convertedAmount: targetAmount } = await this.fetchConvertedAmount({ from, to, amount });
        this.setState({ targetAmount });
      }
    });
  }

  render() {
    const {
      UIReady,
      loading,
      sourceCurrency,
      targetCurrency,
      sourceAmount,
      targetAmount,
      currencies,
      backendError
    } = this.state;

    return html`

      ${UIReady ?
        html`<div className="convert-form">
          ${loading && html`<${Loader} small=${true} />`}
          <div className="convert-form__section">
            <${CurrencySelector} 
              className="convert-form__currency" 
              onChange=${this.onInputChanged('sourceCurrency', true)} 
              currencies=${currencies}
              value=${sourceCurrency}
              key="source-selector" 
            />
            <label>
              <input 
                className="convert-form__amount" 
                type="number" 
                value=${sourceAmount}
                onInput=${this.onInputChanged('sourceAmount', true)} 
                key="source-amount-input" 
              />
            </label>
          </div>
          <div className="convert-form__section">
            <${CurrencySelector} 
              className="convert-form__currency" 
              onChange=${this.onInputChanged('targetCurrency', true)} 
              currencies=${currencies}
              value=${targetCurrency}
              key="target-selector" />
            <label>
              <input 
                className="convert-form__amount" 
                type="number" 
                value=${targetAmount}
                onInput=${this.onInputChanged('targetAmount')} 
                key="target-amount-input" 
              />
            </label>
          </div>
          ${!!backendError && html`<div className="convert-form__section">
            <span className="convert-form__error-message">${backendError}</span>
          </div>`}
        </div>` :

        html`<${Loader} />`
      }
      
    `;
  }

  isValidConversionInput({ from, to, amount }) {
    return from && to && Number.isFinite(parseFloat(amount));
  }

  getConversionInput(fromSource = true) {
    const {
      sourceCurrency,
      targetCurrency,
      sourceAmount,
      targetAmount
    } = this.state;

    return {
      from: fromSource ? sourceCurrency : targetCurrency,
      to: fromSource ? targetCurrency : sourceCurrency,
      amount: fromSource ? sourceAmount : targetAmount
    };
  }

  getStateFromURL(currencies) {
    const [[firstCurrency]] = currencies;
    const currencyCodes = currencies.map(([code]) => code);
    const sourceCurrencyParam = getURLParam(this.params.sourceCurrency);
    const targetCurrencyParam = getURLParam(this.params.targetCurrency);
    const sourceAmountParam = parseFloat(getURLParam(this.params.sourceAmount));

    return {
      sourceAmount: Number.isFinite(sourceAmountParam) ? sourceAmountParam : null,
      sourceCurrency: currencyCodes.includes(sourceCurrencyParam) ? sourceCurrencyParam : firstCurrency,
      targetCurrency: currencyCodes.includes(targetCurrencyParam) ? targetCurrencyParam : firstCurrency
    };
  }

  setURLFromState() {
    setURLParams({
      [this.params.sourceCurrency]: this.state.sourceCurrency,
      [this.params.targetCurrency]: this.state.targetCurrency,
      [this.params.sourceAmount]: this.state.sourceAmount
    });
  }

  async fetchCurrencyList() {
    return await this.get('/currencies');
  }

  async fetchConvertedAmount({ from, to, amount }) {
    return await this.get(`/convert?${new URLSearchParams({ from, to, amount }).toString()}`);
  }

  /*
   * This is the fetch() wrapper taking care of the state properties
   * loading and backendError which are just used during rendering
   * to show the specific loading state and or error retrieved from the backend.
   */
  get(...params) {
    return new Promise((resolve) => {
      this.setState({ loading: true, backendError: null });
      fetch(...params)
        .then(async (response) => {
          this.setState({ loading: false });
          if (!response.ok) {
            const { message } = await response.json() ?? {};
            throw Error(message ?? response.statusText);
          }
          return response;
        })
        .then((response) => resolve(response.json()))
        .catch(({ message }) => {
          this.setState({ backendError: message });
          resolve({});
        })
    });
  }

}

function CurrencySelector({ currencies = [], value = '', className = '', onChange = () => { } }) {
  return html`
    <select value=${value} className=${className} onChange=${onChange}>
      ${currencies.map((currency) => {
    const [code, label] = currency;
    return html`<option value="${code}">${label ?? code}</option>`;
  })}
    </select>
  `;
}

function Loader({ small }) {
  return html`
    <div className=${small ? 'loader loader-small' : 'loader'}>
      <div className="loader-line"></div>
      <div className="loader-line"></div>
    </div>
  `;
}

function getURLParam(name) {
  return (new URLSearchParams(window.location.search)).get(name);
}

function setURLParams(newParams) {
  const params = new URLSearchParams(window.location.search);
  Object.keys(newParams).forEach((key) => {
    const value = newParams[key];
    if (value) {
      params.set(key, newParams[key])
    }
  });

  history.pushState(null, null, `?${params}`);
}

render(
  html`<${CurrencyConverter} />`,
  appRoot
);