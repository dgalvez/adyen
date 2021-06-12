const { html, Component, render } = globalThis.htmPreact;

const appRoot = document.getElementById('app');

function CurrencySelector({ className = '', currencies = [], onChange = () => { } }) {
  return html`
    <select className=${className} onChange=${onChange}>
      ${currencies.map((currency) => {
        const [code, label] = currency;
        return html`<option value="${code}">${label ?? code}</option>`;
      })}
    </select>
  `;
}

class CurrencyConverter extends Component {

  constructor(props) {
    super(props);

    this.onInputChanged = this.onInputChanged.bind(this);

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
  }

  async componentDidMount() {
    const { currencies = [[]] } = await this.fetchCurrencyList();

    const [[initialCurrency]] = currencies;
    this.setState({
      UIReady: true,
      currencies,
      sourceCurrency: initialCurrency,
      targetCurrency: initialCurrency
    });
  }

  onInputChanged(property, isSource) {
    return ({ currentTarget }) => {
      const originalInputValue = currentTarget.value;
      this.setState({ [property]: originalInputValue }, async () => {
        const {
          sourceCurrency,
          targetCurrency,
          sourceAmount,
          targetAmount,
        } = this.state;

        const { convertedAmount } = await this.convert({
          from: isSource ? sourceCurrency : targetCurrency,
          to: isSource ? targetCurrency : sourceCurrency,
          amount: isSource ? sourceAmount : targetAmount
        });

        if (originalInputValue === currentTarget.value) {
          this.setState({
            [isSource ? 'targetAmount' : 'sourceAmount']: convertedAmount
          });
        }
      });
    };
  }

  render() {
    const {
      UIReady,
      sourceAmount,
      targetAmount,
      currencies,
      backendError
    } = this.state;

    return html`

      ${UIReady ?
        html`<div className="convert-form">
          <div className="convert-form__section">
            <${CurrencySelector} 
              className="convert-form__currency" 
              onChange=${this.onInputChanged('sourceCurrency', true)} 
              currencies="${currencies}" 
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
              onChange=${this.onInputChanged('targetCurrency')} 
              currencies="${currencies}" 
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
          <div className="convert-form__section">
            ${!!backendError && html`<span className="convert-form__error-message">${backendError}</span>`}
          </div>
        </div>` :

        html`<div className="loader">
              <div className="loader-line"></div>
              <div className="loader-line"></div>
        </div>`
      }
      
    `;
  }

  async fetchCurrencyList() {
    return await this.get('/currencies');
  }

  async convert({ from, to, amount }) {
    return await this.get(`/convert?${new URLSearchParams({ from, to, amount }).toString()}`);
  }

  get(...params) {
    return new Promise((resolve, reject) => {
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

render(
  html`<${CurrencyConverter} />`,
  appRoot
);