let studentName = document.getElementById('student-name')
let studentGitea = document.getElementById('student-gitea')
let studentEmail = document.getElementById('student-email')
let studentXpAmount = document.getElementById('student-xp-amount')
let studentAuditRatio = document.getElementById('student-audit-ratio')
let audits = document.getElementById('audits')
let progress = document.getElementById('progress')
let skills = document.getElementById('skills')

function buildCharts() {
    let token = localStorage.getItem('token')
    if (token === null || token === undefined) {
        location.replace('/charts/index.html')
    }

    getData(token)
        .then((info) => {
            const userInfo = info.data.user[0]
            console.log(userInfo)
            studentName.innerText = `${userInfo.attrs.firstName}  ${userInfo.attrs.lastName}`
            studentGitea.action = `https://01.kood.tech/git/${userInfo.login}`
            studentEmail.innerText = userInfo.attrs.email
            studentAuditRatio.innerText = `Your audit ratio: ${Math.round((userInfo.totalUp / userInfo.totalDown) * 10) / 10}`

            makeAuditsChart(userInfo.totalUp, userInfo.totalDown)

            const regexPath = /^\/johvi\/div-01\/(?!.*piscine).*$/
            const regexTypeXp = /xp/gm
            const regexTypeSkill = /^skill_.+/gm

            const xpData = userInfo.transactions.filter((task) => regexPath.test(task.path) && regexTypeXp.test(task.type)).map((task) => {
                return {
                    name: task.path.split('/')[3],
                    data: task.amount,
                    date: new Date(task.createdAt).toLocaleDateString('en-GB')
                }
            })
            makeXpChart(xpData)

            let xp = convertBytesToSize(xpData.reduce((sum, task) => sum + task.data, 0))
            studentXpAmount.innerText = `Your XP amount: ${xp.amount} ${xp.size}`

            const skillsData = userInfo.transactions.filter((task) => regexPath.test(task.path) && regexTypeSkill.test(task.type)).map((task) => {
                return {
                    skill: task.type.split('_')[1],
                    data: task.amount
                }
            })
            makeSkillsChart(skillsData)
        })

    const logout = document.getElementById('logout-btn')
    logout.addEventListener('click', () => {
        localStorage.removeItem('token')
        location.replace('/charts/index.html')
    })
}

function makeXpChart(tasks) {
    const amountArray = tasks.map((task) => {
        return convertBytesToKB(task.data)
    })

    const categories = tasks.map((task) => task.name)

    var options = {
        series: [{
            name: 'XP',
            data: amountArray.map((el) => el.amount)
        }],
        chart: {
            height: 350,
            type: 'bar',
        },
        plotOptions: {
            bar: {
                borderRadius: 5,
                dataLabels: {
                    position: 'top',
                },
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val + ' kB';
            },
            offsetY: -20,
            style: {
                fontSize: '12px',
                colors: ["#304758"]
            }
        },
        theme: {
            palette: 'palette5'
        },
        xaxis: {
            categories: categories,
            position: 'bottom',
            axisTicks: {
                show: false
            }
        },
        title: {
            text: 'Your XP history'
        }
    }

    var chart = new ApexCharts(progress, options);
    chart.render();
}

function makeSkillsChart(tasks) {
    const treemapData = tasks.reduce((accumulator, task) => {
        if (accumulator.hasOwnProperty(task.skill)) {
            accumulator[task.skill] += task.data
        } else {
            accumulator[task.skill] = task.data
        }
        return accumulator
    }, {})

    const result = Object.keys(treemapData).map(skill => {
        return {
            x: skill,
            y: treemapData[skill]
        }
    })

    var options = {
        series: [
            {
                data: result
            }
        ],
        legend: {
            show: true
        },
        chart: {
            width: '100%',
            height: 250,
            type: 'treemap'
        },
        theme: {
            palette: 'palette5'
        },
        title: {
            text: 'Your skills distribution'
        }
    };

    var chart = new ApexCharts(skills, options);
    chart.render();
}

function makeAuditsChart(up, down) {
    console.log(up, down)
    var options = {
        series: [up, down],
        chart: {
            width: 250,
            type: 'pie',
        },
        labels: ['given', 'recieved'],
        theme: {
            monochrome: {
                enabled: true,
                color: '#309291',
                shadeTo: 'light',
                shadeIntensity: 0.65
            }
        },
        plotOptions: {
            pie: {
                dataLabels: {
                    offset: -15
                }
            }
        },
        title: {
            text: "Your audits"
        },
        dataLabels: {
            formatter(val, opts) {
                const name = opts.w.globals.labels[opts.seriesIndex]
                return [name, val.toFixed(1) + '%']
            }
        },
        legend: {
            show: false
        }
    }

    var chart = new ApexCharts(audits, options);
    chart.render();
}

async function getData(token) {
    let response = await fetch('https://01.kood.tech/api/graphql-engine/v1/graphql', {
        method: 'POST',

        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
        },

        body: JSON.stringify({
            query: `{ 
                user {
                    id
                    login
                    attrs
                    totalUp
                    totalDown
                    transactions(order_by: { createdAt: asc }) {id type amount path createdAt}
                }
                }`
        })
    })

    let data = await response.json()
    return data
}

function convertBytesToKB(bytes) {
    return {
        amount: Math.round(bytes*100/1000)/100,
        size: "kB"
    }
}

function convertBytesToSize(bytes) {
    const sizes = ["Bytes", "KB", "MB"];

    if (bytes === 0) {
        return "0 Byte";
    }

    const i = Math.floor(Math.log(bytes) / Math.log(1000));
    const convertedValue = parseFloat((bytes / Math.pow(1000, i)).toFixed(2));

    return {
        amount: convertedValue,
        size: sizes[i]
    }
}

buildCharts()