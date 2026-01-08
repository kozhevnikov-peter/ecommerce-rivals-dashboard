const setDeep = (obj, [k, ...r], v) =>
    k === undefined ? v :
        {
            ...obj,
            [k]:
                r.length === 0
                    ? [...(obj?.[k] ?? []), v]
                    : setDeep(obj?.[k] ?? (typeof r[0] === "number" ? [] : {}), r, v)
        };

(async () => {
    const rawData = await fetch('data.json').then(res => res.json());
    const data = rawData.reduce((acc, data) => [...acc, ...data.results.map(result => {
        return {
            service: data.service,
            url: data.url,
            region: data.region,
            type: data.type,
            give_amount: result.payment_amount,
            give_currency: result.payment_currency,
            take_amount: result.funding_amount,
            take_currency: result.funding_currency,
        }
    })], []).reduce(
        (acc, stat) => setDeep(acc, [
            stat.service,
            stat.region,
            stat.give_currency,
            stat.take_currency,
            stat.type
        ], {
            url: stat.url,
            giveAmount: stat.give_amount,
            takeAmount: stat.take_amount,
            rate: stat.give_amount / stat.take_amount
        }), {}
    );

    const main = document.getElementById('main');
    Object.keys(data).forEach(service => {
        // service title
        const serviceTitle = document.createElement('h2');
        serviceTitle.classList.add('uk-heading-bullet');
        serviceTitle.textContent = service;
        main.appendChild(serviceTitle);

        // regions
        const regions = document.createElement('ul');
        regions.classList.add('uk-accordion-default');
        regions.setAttribute('uk-accordion', 'multiple: true');
        Object.keys(data[service]).forEach(regionName => {
            Object.keys(data[service][regionName]).forEach(giveCurrency => {
                Object.keys(data[service][regionName][giveCurrency]).forEach(takeCurrency => {
                    Object.keys(data[service][regionName][giveCurrency][takeCurrency]).forEach(kind => {
                        const best = data[service][regionName][giveCurrency][takeCurrency][kind].reduce((best, stat) => {
                            return stat.rate < best.rate ? stat : best;
                        });
                        const bestProviderUrl = new URL(best.url);
                        const region = document.createElement('li');

                        const regionTitle = document.createElement('a');
                        regionTitle.classList.add('uk-accordion-title');
                        regionTitle.innerHTML = `<span class="uk-text-default">${kind} in ${regionName}</span> <span class="uk-text-meta">${giveCurrency}→${takeCurrency}</span> <span class="uk-badge">${bestProviderUrl.hostname}</span> <span uk-accordion-icon>`;
                        region.appendChild(regionTitle);

                        const regionContent = document.createElement('div');
                        regionContent.classList.add('uk-accordion-content');
                        const table = document.createElement('table');
                        table.classList.add('uk-table', 'uk-table-divider', 'uk-table-small');
                        table.insertAdjacentHTML('beforeend', '<thead><tr><th>Provider</th><th>Give</th><th>Take</th><th>Rate</th><th>Difference</th></tr></thead>');
                        const tableBody = document.createElement('tbody');

                        data[service][regionName][giveCurrency][takeCurrency][kind].forEach(stat => {
                            const url = new URL(stat.url);
                            const tr = document.createElement('tr');
                            tr.insertAdjacentHTML('beforeend', `<td><a href="${stat.url}">${url.hostname}</a></td>`);
                            tr.insertAdjacentHTML('beforeend', `<td>${stat.giveAmount} <span class="uk-text-meta">${giveCurrency}</span></td>`);
                            tr.insertAdjacentHTML('beforeend', `<td>${stat.takeAmount} <span class="uk-text-meta">${takeCurrency}</span></td>`);
                            tr.insertAdjacentHTML('beforeend', `<td>${stat.rate.toFixed(2)}</td>`);
                            tr.insertAdjacentHTML('beforeend', `<td>${best.rate == stat.rate ? '<span class="uk-label uk-label-success">best</span>' : `<span class="uk-label uk-label-danger">+${((stat.rate / best.rate - 1) * 100).toFixed(2)}%</span>`}</td>`);
                            tableBody.appendChild(tr);
                        });

                        table.appendChild(tableBody);
                        regionContent.appendChild(table);
                        region.appendChild(regionContent);

                        regions.appendChild(region);
                    });
                });
            });
        });
        main.appendChild(regions);
    });
})();