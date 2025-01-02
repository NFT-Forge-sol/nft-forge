import { useState } from 'react'
import { Card } from '@nextui-org/react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export default function Tokenomics() {
  const data = [
    { name: 'Community', value: 75, color: '#FF5733' },
    { name: 'Development', value: 10, color: '#33FF57' },
    { name: 'Marketing', value: 5, color: '#3357FF' },
    { name: 'Salary', value: 5, color: '#FF33F6' },
    { name: 'Investors', value: 5, color: '#33FFF6' },
  ]

  return (
    <div className="min-h-screen w-full p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Tokenomics</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Understanding the distribution and utility of the FORGE token in our ecosystem (NO TOKEN DEPLOYED YET)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6 bg-forge-400/50 backdrop-blur-md border border-primary-500/20">
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={180}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 bg-forge-400/50 backdrop-blur-md border border-primary-500/20">
            <h2 className="text-2xl font-bold mb-6">Token Distribution</h2>
            <div className="space-y-6">
              {data.map((item, index) => (
                <div key={index} className="border-b border-primary-500/20 pb-4 last:border-none">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-lg">{item.name}</span>
                    <span className="text-lg">{item.value}%</span>
                  </div>
                  <div className="w-full bg-default-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2 p-6 bg-forge-400/50 backdrop-blur-md border border-primary-500/20">
            <h2 className="text-2xl font-bold mb-6">Token Utility</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Community (75%)</h3>
                <p className="text-sm text-gray-400">Reserved for the community.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Development (10%)</h3>
                <p className="text-sm text-gray-400">
                  Allocated for ongoing platform development, technical improvements, and innovation.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Marketing & Operations (5%)</h3>
                <p className="text-sm text-gray-400">
                  Dedicated to marketing campaigns, partnerships, and operational expenses.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Team & Advisors (5%)</h3>
                <p className="text-sm text-gray-400">Allocated for team compensation, advisors, and future hiring.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
